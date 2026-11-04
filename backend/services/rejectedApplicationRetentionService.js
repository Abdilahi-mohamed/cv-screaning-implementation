const fs = require('fs');
const path = require('path');
const CV = require('../models/CV');
const Evaluation = require('../models/Evaluation');
const Feedback = require('../models/Feedback');
const InterviewQuestion = require('../models/InterviewQuestion');
const Ranking = require('../models/Ranking');
const RecruitmentConversation = require('../models/RecruitmentConversation');
const SystemSetting = require('../models/SystemSetting');
const { documentRoot } = require('./documentService');

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const LOCK_STALE_AFTER_MS = 60 * 60 * 1000;
const BATCH_SIZE = 100;
let cleanupRunning = false;

const subtractMonths = (date, months) => {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
};

const getStoredFilenames = (candidate) => {
  const documents = [
    ...Object.values(candidate.documents || {}),
    ...(candidate.application_documents || []).map((item) => item?.document),
  ];
  const filenames = new Set();
  for (const document of documents) {
    if (!document?.filename) continue;
    if (path.basename(document.filename) !== document.filename) {
      throw new Error('Rejected application contains an unsafe document filename.');
    }
    filenames.add(document.filename);
  }
  return [...filenames];
};

const removeStoredFiles = async (filenames) => {
  for (const filename of filenames) {
    const filePath = path.resolve(documentRoot, filename);
    if (path.dirname(filePath) !== path.resolve(documentRoot)) {
      throw new Error('Rejected application document path is outside the upload directory.');
    }
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
};

const anonymizeRelatedRecords = async (candidate) => {
  await Promise.all([
    Evaluation.updateMany(
      { cv_id: candidate.cv_id, job_id: candidate.job_id },
      { $set: { feedback: '', matched_requirements: [], missing_requirements: [], claude_response: '' } },
    ),
    Feedback.updateMany(
      { cv_id: candidate.cv_id, job_id: candidate.job_id },
      { $set: { manager_notes: '' } },
    ),
    Ranking.updateMany(
      { candidate_id: candidate.cv_id, job_id: candidate.job_id },
      { $set: { recommendation: '' } },
    ),
    InterviewQuestion.deleteMany({ candidate_id: candidate.cv_id, job_id: candidate.job_id }),
    RecruitmentConversation.deleteMany({ candidate_id: candidate.cv_id, job_id: candidate.job_id }),
  ]);
};

const runRejectedApplicationRetention = async () => {
  if (cleanupRunning) return;
  cleanupRunning = true;
  try {
    const settings = await SystemSetting.findOne({ key: 'platform' }).select('rejected_retention_months').lean();
    const retentionMonths = settings?.rejected_retention_months === undefined
      ? 6
      : settings.rejected_retention_months;
    if (retentionMonths === null) return;

    const now = new Date();
    const cutoff = subtractMonths(now, retentionMonths);
    const staleLock = new Date(now.getTime() - LOCK_STALE_AFTER_MS);
    const expiredCandidates = await CV.find({
      status: 'rejected',
      uploaded_at: { $lte: cutoff },
      anonymized_at: null,
    }).sort({ uploaded_at: 1 }).limit(BATCH_SIZE).lean();

    for (const candidate of expiredCandidates) {
      const lockTime = new Date();
      const claimed = await CV.findOneAndUpdate(
        {
          _id: candidate._id,
          status: 'rejected',
          anonymized_at: null,
          uploaded_at: { $lte: cutoff },
          $or: [
            { retention_cleanup_started_at: null },
            { retention_cleanup_started_at: { $lte: staleLock } },
          ],
        },
        { $set: { retention_cleanup_started_at: lockTime } },
        { new: true },
      ).lean();
      if (!claimed) continue;

      try {
        await removeStoredFiles(getStoredFilenames(claimed));
        await anonymizeRelatedRecords(claimed);
        const result = await CV.updateOne(
          {
            _id: claimed._id,
            status: 'rejected',
            retention_cleanup_started_at: lockTime,
          },
          {
            $set: {
              candidate_name: 'Anonymous candidate',
              candidate_email: '',
              candidate_phone: '',
              candidate_address: '',
              candidate_linkedin: '',
              candidate_city: '',
              application_responses: {},
              application_documents: [],
              cv_text: '',
              cv_file_name: '',
              certificate_file_name: '',
              kur_file_name: '',
              documents: { cv: null, certificate: null, kur: null },
              embedding: [],
              anonymized_at: new Date(),
            },
            $unset: { retention_cleanup_started_at: 1 },
          },
        );
        if (!result.modifiedCount) {
          throw new Error(`Could not finalize anonymization for rejected application ${claimed.cv_id}.`);
        }
      } catch (error) {
        await CV.updateOne(
          { _id: claimed._id, retention_cleanup_started_at: lockTime },
          { $unset: { retention_cleanup_started_at: 1 } },
        );
        console.error(`Could not anonymize rejected application ${claimed.cv_id}:`, error);
      }
    }
  } finally {
    cleanupRunning = false;
  }
};

const startRejectedApplicationRetention = () => {
  const run = () => {
    runRejectedApplicationRetention().catch((error) => {
      console.error('Rejected application retention cleanup failed:', error);
    });
  };
  const startupTimer = setTimeout(run, 60 * 1000);
  startupTimer.unref?.();
  const interval = setInterval(run, DAY_IN_MS);
  interval.unref?.();
};

module.exports = { runRejectedApplicationRetention, startRejectedApplicationRetention };
