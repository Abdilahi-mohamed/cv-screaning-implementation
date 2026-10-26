const mongoose = require('mongoose');
const Job = require('../models/Job');
const CV = require('../models/CV');
const Evaluation = require('../models/Evaluation');
const Feedback = require('../models/Feedback');
const InterviewQuestion = require('../models/InterviewQuestion');
const { getStore } = require('../data/store');
const { createSignedDocumentUrl } = require('../services/documentService');

const useMemory = () => mongoose.connection.readyState !== 1;

const getCandidateDocuments = (candidate) => {
  const getDocument = (document) => document?.filename ? {
    name: document.originalName || document.filename,
    mime_type: document.mimeType || '',
    url: createSignedDocumentUrl(document.filename),
    size: document.size || 0,
    uploaded_at: document.uploadedAt || null,
  } : null;

  return {
    cv: getDocument(candidate?.documents?.cv),
    certificate: getDocument(candidate?.documents?.certificate),
    profile: getDocument(candidate?.documents?.kur),
  };
};

const getCandidateApplicationData = (candidate, fields) => ({
  application_responses: Object.entries(candidate?.application_responses || {}).map(([id, value]) => ({
    label: fields.find((field) => field.id === id)?.label || id,
    value,
  })),
  application_documents: (candidate?.application_documents || []).map((item) => ({
    label: fields.find((field) => field.key === item.field_id)?.label || item.field_id,
    name: item.document?.originalName || item.original_name,
    url: item.document?.filename ? createSignedDocumentUrl(item.document.filename) : '',
  })),
});

const getDashboardStats = async (req, res) => {
  try {
    const { jobId } = req.params;
    const store = getStore();
    const job = useMemory() ? store.jobs.find((item) => item.job_id === jobId) : await Job.findOne({ job_id: jobId });
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    const totalCandidates = useMemory() ? store.cvs.filter((cv) => cv.job_id === jobId).length : await CV.countDocuments({ job_id: jobId });
    const passedFilter = useMemory() ? store.cvs.filter((cv) => cv.job_id === jobId && cv.similarity_score > 0.3).length : await CV.countDocuments({ job_id: jobId, similarity_score: { $gt: 0.3 } });
    const evaluated = useMemory() ? store.evaluations.filter((item) => item.job_id === jobId).length : await Evaluation.countDocuments({ job_id: jobId });
    const shortlisted = useMemory() ? store.cvs.filter((cv) => cv.job_id === jobId && cv.status === 'shortlisted').length : await CV.countDocuments({ job_id: jobId, status: 'shortlisted' });
    const rejected = useMemory() ? store.cvs.filter((cv) => cv.job_id === jobId && cv.status === 'rejected').length : await CV.countDocuments({ job_id: jobId, status: 'rejected' });

    let topCandidates = [];
    if (useMemory()) {
      topCandidates = store.evaluations
        .filter((item) => item.job_id === jobId)
        .sort((a, b) => b.final_score - a.final_score)
        .slice(0, 5)
        .map((result) => {
          const candidate = store.cvs.find((cv) => cv.cv_id === result.cv_id);
          return {
            name: candidate?.candidate_name || 'Candidate',
            score: result.final_score,
            status: candidate?.status || 'evaluated',
            details: result.details,
          };
        });
    } else {
      const ranking = await Evaluation.find({ job_id: jobId }).sort({ final_score: -1 }).limit(5);
      topCandidates = await Promise.all(
        ranking.map(async (result) => {
          const candidate = await CV.findOne({ cv_id: result.cv_id });
          return {
            name: candidate?.candidate_name || 'Candidate',
            score: result.final_score,
            status: candidate?.status || 'evaluated',
            details: result.details,
          };
        })
      );
    }

    const pendingDecision = Math.max(totalCandidates - shortlisted - rejected, 0);

    const interviewQuestions = useMemory()
      ? store.interviewQuestions.filter((item) => item.job_id === jobId)
      : await InterviewQuestion.find({ job_id: jobId });
    const topInterviewQuestions = interviewQuestions.map((item) => ({
      name: item.candidate_name || (useMemory()
        ? store.cvs.find((candidate) => candidate.cv_id === item.candidate_id)?.candidate_name
        : ''),
      score: topCandidates.find((candidate) => candidate.name === item.candidate_name)?.score,
      cv_id: item.candidate_id,
      questions: item.questions,
    }));

    res.json({
      job_id: jobId,
      title: job.title,
      stats: {
        total_candidates: totalCandidates,
        passed_filter: passedFilter,
        evaluated,
        shortlisted,
        rejected,
        pending_decision: pendingDecision,
      },
      top_candidates: topCandidates,
      interview_questions: topInterviewQuestions,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch dashboard stats.' });
  }
};

const getRanking = async (req, res) => {
  try {
    const { jobId } = req.params;
    const store = getStore();
    const job = useMemory() ? store.jobs.find((item) => item.job_id === jobId) : await Job.findOne({ job_id: jobId });
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    const applicationFields = Array.isArray(job.application_fields) ? job.application_fields : [];

    const [candidates, evaluations, feedbacks, interviews] = useMemory()
      ? [
        store.cvs.filter((candidate) => candidate.job_id === jobId),
        store.evaluations.filter((item) => item.job_id === jobId),
        store.feedbacks.filter((item) => item.job_id === jobId),
        store.interviewQuestions.filter((item) => item.job_id === jobId),
      ]
      : await Promise.all([
        CV.find({ job_id: jobId }).sort({ uploaded_at: -1 }),
        Evaluation.find({ job_id: jobId }),
        Feedback.find({ job_id: jobId }),
        InterviewQuestion.find({ job_id: jobId }),
      ]);
    const evaluationByCandidate = new Map(evaluations.map((item) => [item.cv_id, item]));
    const feedbackByCandidate = new Map(feedbacks.map((item) => [item.cv_id, item]));
    const interviewByCandidate = new Map(interviews.map((item) => [item.candidate_id, item]));
    const rankedCandidates = candidates.map((candidate) => {
      const evaluation = evaluationByCandidate.get(candidate.cv_id);
      const feedback = feedbackByCandidate.get(candidate.cv_id);
      const interview = interviewByCandidate.get(candidate.cv_id);
      return {
        cv_id: candidate.cv_id,
        candidate_name: candidate.candidate_name || 'Candidate',
        email: candidate.candidate_email || '-',
        phone: candidate.candidate_phone || '',
        linkedin: candidate.candidate_linkedin || '',
        city: candidate.candidate_city || '',
        address: candidate.candidate_address || '',
        uploaded_at: candidate.uploaded_at || null,
        score: evaluation ? evaluation.final_score : null,
        analysis_status: evaluation ? 'analyzed' : 'not_analyzed',
        status: candidate.status === 'shortlisted' ? 'shortlisted' : candidate.status === 'rejected' ? 'rejected' : 'pending_decision',
        feedback: evaluation?.feedback || '',
        notes: feedback?.manager_notes || '',
        details: evaluation?.details || null,
        documents: getCandidateDocuments(candidate),
        ...getCandidateApplicationData(candidate, applicationFields),
        matched_requirements: evaluation?.matched_requirements || [],
        missing_requirements: evaluation?.missing_requirements || [],
        questions: interview?.questions || [],
        recommendation: evaluation
          ? evaluation.final_score >= 85 ? 'Strong fit' : evaluation.final_score >= 70 ? 'Needs review' : 'Review evidence'
          : 'Not analyzed',
      };
    }).sort((a, b) => {
      if (a.score === null) return b.score === null ? 0 : 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    }).map((candidate, index) => ({ ...candidate, rank: candidate.score === null ? null : index + 1 }));

    return res.json({ job_id: jobId, ranking: rankedCandidates });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch ranking.' });
  }
};

module.exports = { getDashboardStats, getRanking };
