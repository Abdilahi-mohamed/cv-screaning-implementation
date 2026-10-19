const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const CV = require('../models/CV');
const Evaluation = require('../models/Evaluation');
const Feedback = require('../models/Feedback');
const InterviewQuestion = require('../models/InterviewQuestion');
const Ranking = require('../models/Ranking');
const RecruitmentConversation = require('../models/RecruitmentConversation');
const Job = require('../models/Job');
const { getStore } = require('../data/store');
const { computeJobSimilarity } = require('../services/embeddingService');
const { extractTextFromFile } = require('../services/cvExtractionService');
const { evaluateWithOpenRouter } = require('../services/openRouterService');
const { generateId } = require('../utils/helpers');
const { buildDocumentRecord, sanitizeFileName, documentRoot } = require('../services/documentService');

const useMemory = () => mongoose.connection.readyState !== 1;

const defaultApplicationFields = [
  { id: 'candidate_name', key: 'candidate_name', label: 'Full name', type: 'text', required: true },
  { id: 'candidate_email', key: 'candidate_email', label: 'Email address', type: 'email', required: true },
  { id: 'candidate_phone', key: 'candidate_phone', label: 'Phone number', type: 'tel', required: true },
  { id: 'candidate_linkedin', key: 'candidate_linkedin', label: 'LinkedIn profile', type: 'url', required: false },
  { id: 'cv_file', key: 'cv_file', label: 'CV or resume', type: 'file', required: true },
  { id: 'certificate_file', key: 'certificate_file', label: 'Certificate', type: 'file', required: true },
  { id: 'kur_file', key: 'kur_file', label: 'KUR image', type: 'file', required: true },
];

const plainText = (value) => String(value || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .trim();

const getDocumentFile = (req, file, fieldName) => {
  if (!file) return null;
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    path: file.path,
    size: file.size,
    fieldName,
  };
};

const normalizeCandidate = (body) => ({
  candidate_name: String(body.candidate_name || body.full_name || '').trim(),
  candidate_email: String(body.candidate_email || body.email || '').trim(),
  candidate_phone: String(body.candidate_phone || body.phone || '').trim(),
  candidate_address: String(body.candidate_address || body.address || '').trim(),
  candidate_linkedin: String(body.candidate_linkedin || body.linkedin || '').trim(),
  candidate_city: String(body.candidate_city || body.city || '').trim(),
});

const uploadApplication = async (req, res) => {
  try {
    const { job_id, jobId } = req.body;
    const targetJobId = job_id || jobId || req.params?.jobId;
    const candidateData = normalizeCandidate(req.body);
    const candidateName = candidateData.candidate_name;
    const candidateEmail = candidateData.candidate_email;
    const candidatePhone = candidateData.candidate_phone;

    if (!targetJobId || !candidateName || !candidateEmail) {
      return res.status(400).json({ message: 'Job ID, full name and email are required.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const files = Array.isArray(req.files) ? req.files : [];

    let job = null;
    if (useMemory()) {
      job = getStore().jobs.find((item) => item.job_id === targetJobId);
    } else {
      job = await Job.findOne({ job_id: targetJobId });
    }

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const applicationFields = Array.isArray(job.application_fields) && job.application_fields.length
      ? job.application_fields
      : defaultApplicationFields;
    const getFile = (key) => files.find((file) => file.fieldname === key) || null;
    const cvFile = getFile('cv_file');
    const certificateFile = getFile('certificate_file');
    const kurFile = getFile('kur_file');
    const isUploadField = (field) => ['file', 'image'].includes(field.type);

    if (!cvFile) return res.status(400).json({ message: 'Please upload your CV as a PDF or Word document.' });
    for (const field of applicationFields) {
      if (!field.required) continue;
      const hasFile = isUploadField(field) && getFile(field.key);
      const hasValue = !isUploadField(field) && String(req.body[field.key] || '').trim();
      if (!hasFile && !hasValue) {
        return res.status(400).json({ message: `${field.label || 'A required field'} is required.` });
      }
    }

    const allowedDocumentExtensions = ['.pdf', '.doc', '.docx'];
    const allowedImageTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    for (const file of files) {
      const extension = path.extname(file.originalname || '').toLowerCase();
      const field = applicationFields.find((item) => item.key === file.fieldname);
      const expectedType = file.fieldname === 'kur_file' ? 'image' : field?.type;
      if (file.fieldname === 'cv_file' || file.fieldname === 'certificate_file') {
        if (!allowedDocumentExtensions.includes(extension)) {
          return res.status(400).json({ message: 'CVs and certificates must be uploaded as PDF or Word documents.' });
        }
      } else if (expectedType === 'image') {
        if (allowedImageTypes[extension] !== file.mimetype) {
          return res.status(400).json({ message: `${field?.label || 'Image'} must be JPEG, PNG, WebP, or GIF.` });
        }
      } else if (expectedType === 'file') {
        if (!allowedDocumentExtensions.includes(extension)) {
          return res.status(400).json({ message: `${field?.label || 'Document'} must be a PDF or Word file.` });
        }
      } else {
        return res.status(400).json({ message: 'An uploaded file does not match an application form upload field.' });
      }
    }

    if (certificateFile && path.extname(certificateFile.originalname || '').toLowerCase() !== '.pdf') {
      return res.status(400).json({ message: 'Certificate must be uploaded as a PDF file.' });
    }

    const absolutePath = path.resolve(cvFile.path);
    const extractedText = await extractTextFromFile(absolutePath, cvFile.mimetype);

    if (!extractedText.trim()) {
      return res.status(400).json({ message: 'Could not read text from the uploaded CV. Please upload a text-based PDF or Word document.' });
    }

    const jobDescription = plainText(job.description);
    const similarity = computeJobSimilarity(extractedText, jobDescription, job.rubric);
    const cvId = generateId('cv');
    const evaluation = await evaluateWithOpenRouter(extractedText, jobDescription, job.rubric);
    const applicationResponses = {};
    for (const field of applicationFields) {
      if (!isUploadField(field) && req.body[field.key] !== undefined) {
        applicationResponses[field.id] = String(req.body[field.key]).trim();
      }
    }
    const applicationDocuments = files
      .filter((file) => !['cv_file', 'certificate_file', 'kur_file'].includes(file.fieldname))
      .map((file) => ({
        field_id: file.fieldname,
        original_name: sanitizeFileName(file.originalname || 'document'),
        document: buildDocumentRecord(file, file.fieldname),
      }));

    const record = {
      cv_id: cvId,
      job_id: targetJobId,
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      candidate_phone: candidatePhone,
      candidate_address: candidateData.candidate_address,
      candidate_linkedin: candidateData.candidate_linkedin,
      candidate_city: candidateData.candidate_city,
      application_responses: applicationResponses,
      application_documents: applicationDocuments,
      cv_text: extractedText,
      cv_file_name: sanitizeFileName(cvFile.originalname || 'cv'),
      certificate_file_name: sanitizeFileName(certificateFile.originalname || 'certificate.pdf'),
      kur_file_name: sanitizeFileName(kurFile.originalname || 'kur'),
      documents: {
        cv: buildDocumentRecord(cvFile, 'cv'),
        certificate: buildDocumentRecord(certificateFile, 'certificate'),
        kur: buildDocumentRecord(kurFile, 'kur'),
      },
      similarity_score: similarity,
      status: 'evaluated',
      uploaded_at: new Date().toISOString(),
    };

    const evaluationRecord = {
      evaluation_id: generateId('eval'),
      cv_id: cvId,
      job_id: targetJobId,
      final_score: evaluation.final_score,
      details: evaluation.details,
      feedback: evaluation.feedback,
      claude_response: JSON.stringify(evaluation),
      evaluated_at: new Date().toISOString(),
    };

    if (useMemory()) {
      getStore().cvs.unshift(record);
      getStore().evaluations.unshift(evaluationRecord);
      return res.status(201).json({
        cv_id: record.cv_id,
        job_id: targetJobId,
        similarity_score: similarity,
        score: evaluation.final_score,
        feedback: evaluation.feedback,
        status: 'evaluated',
        cv: record,
      });
    }

    const cv = await CV.create(record);
    await Evaluation.create(evaluationRecord);
    return res.status(201).json({
      cv_id: cv.cv_id,
      job_id: targetJobId,
      similarity_score: similarity,
      score: evaluation.final_score,
      feedback: evaluation.feedback,
      status: 'evaluated',
      cv,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to upload application.' });
  }
};

const uploadCV = uploadApplication;

const uploadManagerCVs = async (req, res) => {
  try {
    const { jobId } = req.params;
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: 'Select at least one CV to upload.' });

    const job = useMemory()
      ? getStore().jobs.find((item) => item.job_id === jobId)
      : await Job.findOne({ job_id: jobId });
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    const records = [];
    for (const file of files) {
      const cvText = await extractTextFromFile(path.resolve(file.path), file.mimetype);
      if (!cvText.trim()) {
        return res.status(400).json({ message: `Could not read text from ${file.originalname}. Upload a text-based PDF or Word document.` });
      }
      const email = cvText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
      const candidateName = path.basename(file.originalname, path.extname(file.originalname))
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const record = {
        cv_id: generateId('cv'),
        job_id: jobId,
        candidate_name: candidateName || 'Candidate',
        candidate_email: email,
        cv_text: cvText,
        cv_file_name: sanitizeFileName(file.originalname || 'cv'),
        documents: { cv: buildDocumentRecord(file, 'cv') },
        similarity_score: computeJobSimilarity(cvText, job.responsibilities || plainText(job.description), job.rubric),
        status: 'uploaded',
        uploaded_at: new Date().toISOString(),
      };
      records.push(record);
    }

    if (useMemory()) {
      getStore().cvs.unshift(...records);
    } else {
      await CV.insertMany(records);
    }
    return res.status(201).json({
      job_id: jobId,
      uploaded: records.length,
      candidates: records.map(({ cv_id, candidate_name, candidate_email }) => ({ cv_id, candidate_name, candidate_email })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to upload CVs.' });
  }
};

const listFilteredCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    const store = getStore();
    const job = useMemory() ? store.jobs.find((item) => item.job_id === jobId) : await Job.findOne({ job_id: jobId });
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const cvs = useMemory()
      ? store.cvs.filter((cv) => cv.job_id === jobId).sort((a, b) => b.similarity_score - a.similarity_score)
      : await CV.find({ job_id: jobId }).sort({ similarity_score: -1 });

    const filtered = cvs.filter((cv) => cv.similarity_score > 0.3);

    return res.json({
      job_id: jobId,
      total_cvs: cvs.length,
      filtered_cvs: filtered.length,
      candidates: filtered.map((cv) => ({
        cv_id: cv.cv_id,
        name: cv.candidate_name,
        similarity: cv.similarity_score,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to filter candidates.' });
  }
};

const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = useMemory() ? getStore().cvs.find((item) => item.cv_id === id) : await CV.findOne({ cv_id: id });
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }
    return res.json(candidate);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch candidate.' });
  }
};

const getCandidatesForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (useMemory()) {
      const items = getStore().cvs.filter((item) => item.job_id === jobId).sort((a, b) => b.uploaded_at - a.uploaded_at);
      return res.json(items);
    }
    const items = await CV.find({ job_id: jobId }).sort({ uploaded_at: -1 });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch candidates.' });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const candidate = useMemory()
      ? getStore().cvs.find((item) => item.cv_id === candidateId && item.job_id === jobId)
      : await CV.findOne({ cv_id: candidateId, job_id: jobId });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this job.' });

    const filenames = new Set();
    const collectFilename = (document) => {
      if (typeof document?.filename === 'string' && document.filename) filenames.add(document.filename);
    };
    Object.values(candidate.documents || {}).forEach(collectFilename);
    (candidate.application_documents || []).forEach((item) => collectFilename(item.document));

    if (useMemory()) {
      const store = getStore();
      store.cvs = store.cvs.filter((item) => !(item.cv_id === candidateId && item.job_id === jobId));
      store.evaluations = store.evaluations.filter((item) => !(item.cv_id === candidateId && item.job_id === jobId));
      store.feedbacks = store.feedbacks.filter((item) => !(item.cv_id === candidateId && item.job_id === jobId));
      store.interviewQuestions = store.interviewQuestions.filter((item) => !(item.candidate_id === candidateId && item.job_id === jobId));
      store.rankings = store.rankings.filter((item) => !(item.candidate_id === candidateId && item.job_id === jobId));
      store.recruitmentConversations = store.recruitmentConversations.filter((item) => !(item.candidate_id === candidateId && item.job_id === jobId));
    } else {
      await Promise.all([
        CV.deleteOne({ cv_id: candidateId, job_id: jobId }),
        Evaluation.deleteMany({ cv_id: candidateId, job_id: jobId }),
        Feedback.deleteMany({ cv_id: candidateId, job_id: jobId }),
        InterviewQuestion.deleteMany({ candidate_id: candidateId, job_id: jobId }),
        Ranking.deleteMany({ candidate_id: candidateId, job_id: jobId }),
        RecruitmentConversation.deleteMany({ candidate_id: candidateId, job_id: jobId }),
      ]);
    }

    let cleanupFailed = false;
    for (const filename of filenames) {
      const filePath = path.resolve(documentRoot, filename);
      if (path.dirname(filePath) !== path.resolve(documentRoot) || path.basename(filename) !== filename) {
        cleanupFailed = true;
        continue;
      }
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') cleanupFailed = true;
      }
    }

    if (cleanupFailed) {
      console.error('One or more candidate document files could not be removed after deleting a candidate.');
    }
    return res.json({
      message: cleanupFailed
        ? 'Candidate and related records deleted. One or more document files could not be removed.'
        : 'Candidate and related records deleted.',
      cleanup_pending: cleanupFailed,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to delete this candidate.' });
  }
};

module.exports = { uploadCV, uploadManagerCVs, listFilteredCandidates, getCandidateById, getCandidatesForJob, deleteCandidate };
