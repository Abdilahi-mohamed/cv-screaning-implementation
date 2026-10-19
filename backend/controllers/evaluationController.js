const mongoose = require('mongoose');
const CV = require('../models/CV');
const Evaluation = require('../models/Evaluation');
const InterviewQuestion = require('../models/InterviewQuestion');
const Job = require('../models/Job');
const RecruitmentConversation = require('../models/RecruitmentConversation');
const { getStore } = require('../data/store');
const { evaluateWithOpenRouter, generateInterviewQuestions, criterionMatches } = require('../services/openRouterService');
const { generateId } = require('../utils/helpers');

const useMemory = () => mongoose.connection.readyState !== 1;
const getRequirements = (job) => ({
  ...(job.rubric?.toObject?.() || job.rubric || {}),
  job_title: job.title,
  must_have: job.rubric?.must_have?.length ? job.rubric.must_have : job.required_skills || [],
  required_skills: job.required_skills || [],
  required_qualifications: job.required_qualifications || [],
  required_experience: job.required_experience || '',
  education_requirements: job.education_requirements || [],
  other_requirements: job.other_requirements || [],
  responsibilities: job.responsibilities || job.description || '',
  experience_requirements: job.required_experience ? [job.required_experience] : [],
});

const analyzeRequirements = (cvText, requirements) => {
  const criteria = [...new Set([
    ...(requirements.must_have || []),
    ...(requirements.required_qualifications || []),
    ...(requirements.education_requirements || []),
    ...(requirements.other_requirements || []),
    ...(requirements.experience_requirements || []),
  ].map((criterion) => String(criterion).trim()).filter(Boolean))];
  const matched = criteria.filter((criterion) => criterionMatches(cvText, criterion));
  return {
    matched_requirements: matched,
    missing_requirements: criteria.filter((criterion) => !matched.includes(criterion)),
  };
};

const loadJob = async (jobId) => (
  useMemory()
    ? getStore().jobs.find((item) => item.job_id === jobId)
    : Job.findOne({ job_id: jobId })
);

const loadCVs = async (jobId) => (
  useMemory()
    ? getStore().cvs.filter((item) => item.job_id === jobId)
    : CV.find({ job_id: jobId })
);

const saveEvaluation = async (evaluation) => {
  if (useMemory()) {
    const store = getStore();
    const index = store.evaluations.findIndex((item) => item.cv_id === evaluation.cv_id && item.job_id === evaluation.job_id);
    if (index >= 0) store.evaluations.splice(index, 1);
    store.evaluations.unshift(evaluation);
  } else {
    await Evaluation.findOneAndUpdate(
      { cv_id: evaluation.cv_id, job_id: evaluation.job_id },
      { $set: evaluation },
      { upsert: true, new: true, runValidators: true },
    );
  }
};

const analyzeJobCVs = async (req, res) => {
  try {
    const job = await loadJob(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    const cvs = await loadCVs(req.params.jobId);
    if (!cvs.length) return res.status(400).json({ message: 'Upload at least one CV before starting the evaluation.' });

    const requirements = getRequirements(job);
    const analyzed = [];
    for (const cv of cvs) {
      const evaluation = await evaluateWithOpenRouter(cv.cv_text, job.responsibilities || job.description, requirements);
      const record = {
        evaluation_id: generateId('eval'),
        cv_id: cv.cv_id,
        job_id: job.job_id,
        final_score: evaluation.final_score,
        details: evaluation.details,
        feedback: evaluation.feedback,
        claude_response: JSON.stringify(evaluation),
        evaluated_at: new Date().toISOString(),
      };
      await saveEvaluation(record);
      if (useMemory()) {
        const candidate = getStore().cvs.find((item) => item.cv_id === cv.cv_id);
        if (candidate && !['shortlisted', 'rejected'].includes(candidate.status)) candidate.status = 'evaluated';
      } else if (!['shortlisted', 'rejected'].includes(cv.status)) {
        cv.status = 'evaluated';
        await cv.save();
      }
      analyzed.push({ ...record, candidate_name: cv.candidate_name });
    }

    analyzed.sort((a, b) => b.final_score - a.final_score);
    return res.json({ job_id: job.job_id, analyses: analyzed });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to analyze CVs.' });
  }
};

const matchJobCVs = async (req, res) => {
  try {
    const job = await loadJob(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    const cvs = await loadCVs(req.params.jobId);
    const evaluations = useMemory()
      ? getStore().evaluations.filter((item) => item.job_id === job.job_id)
      : await Evaluation.find({ job_id: job.job_id });
    if (!cvs.length || !evaluations.length) {
      return res.status(400).json({ message: 'Analyze the job CVs before matching candidates.' });
    }

    const requirements = getRequirements(job);
    const matches = [];
    for (const evaluation of evaluations) {
      const cv = cvs.find((candidate) => candidate.cv_id === evaluation.cv_id);
      if (!cv) continue;
      const match = analyzeRequirements(cv.cv_text, requirements);
      if (useMemory()) {
        Object.assign(evaluation, match);
      } else {
        await Evaluation.updateOne(
          { cv_id: cv.cv_id, job_id: job.job_id },
          { $set: match },
        );
      }
      matches.push({ cv_id: cv.cv_id, candidate_name: cv.candidate_name, ...match });
    }
    return res.json({ job_id: job.job_id, matches });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to match candidates to job requirements.' });
  }
};

const generateJobQuestions = async (req, res) => {
  try {
    const job = await loadJob(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    const cvs = await loadCVs(req.params.jobId);
    const evaluations = useMemory()
      ? getStore().evaluations.filter((item) => item.job_id === job.job_id)
      : await Evaluation.find({ job_id: job.job_id });
    if (!evaluations.length) return res.status(400).json({ message: 'Analyze the job CVs before generating interview questions.' });

    const requirements = getRequirements(job);
    const generated = [];
    for (const evaluation of evaluations) {
      const candidate = cvs.find((cv) => cv.cv_id === evaluation.cv_id);
      if (!candidate) continue;
      const questions = await generateInterviewQuestions(candidate.cv_text, job.responsibilities || job.description, requirements, candidate.candidate_name);
      const questionRecord = {
        question_id: generateId('questions'),
        candidate_id: candidate.cv_id,
        job_id: job.job_id,
        candidate_name: candidate.candidate_name,
        questions,
      };
      if (useMemory()) {
        const store = getStore();
        const index = store.interviewQuestions.findIndex((item) => item.candidate_id === candidate.cv_id && item.job_id === job.job_id);
        if (index >= 0) store.interviewQuestions.splice(index, 1);
        store.interviewQuestions.unshift(questionRecord);
      } else {
        await InterviewQuestion.findOneAndUpdate(
          { candidate_id: candidate.cv_id, job_id: job.job_id },
          { $set: questionRecord },
          { upsert: true, new: true, runValidators: true },
        );
      }
      generated.push({ cv_id: candidate.cv_id, candidate_name: candidate.candidate_name, questions });
    }
    return res.json({ job_id: job.job_id, interview_questions: generated });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to generate interview questions.' });
  }
};

const generateCandidateQuestions = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const conversationId = typeof req.body?.conversation_id === 'string' ? req.body.conversation_id.trim() : '';
    const job = await loadJob(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    const candidates = await loadCVs(jobId);
    const candidate = candidates.find((item) => item.cv_id === candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this job.' });

    let conversation = null;
    if (conversationId) {
      if (useMemory()) {
        conversation = getStore().recruitmentConversations.find((item) =>
          item.job_id === jobId && item.candidate_id === candidateId && item.conversation_id === conversationId);
      } else {
        conversation = await RecruitmentConversation.findOne({
          job_id: jobId,
          candidate_id: candidateId,
          conversation_id: conversationId,
        });
        if (!conversation && mongoose.Types.ObjectId.isValid(conversationId)) {
          conversation = await RecruitmentConversation.findOne({
            job_id: jobId,
            candidate_id: candidateId,
            _id: conversationId,
          });
        }
      }
      if (!conversation) return res.status(404).json({ message: 'Conversation not found for this candidate.' });
    }

    const questions = await generateInterviewQuestions(
      candidate.cv_text,
      job.responsibilities || job.description,
      getRequirements(job),
      candidate.candidate_name,
    );
    const questionRecord = {
      question_id: generateId('questions'),
      candidate_id: candidate.cv_id,
      job_id: job.job_id,
      candidate_name: candidate.candidate_name,
      questions: questions.slice(0, 10),
    };
    if (useMemory()) {
      const store = getStore();
      const index = store.interviewQuestions.findIndex((item) => item.candidate_id === candidateId && item.job_id === jobId);
      if (index >= 0) store.interviewQuestions[index] = questionRecord;
      else store.interviewQuestions.unshift(questionRecord);
    } else {
      await InterviewQuestion.findOneAndUpdate(
        { candidate_id: candidateId, job_id: jobId },
        { $set: questionRecord },
        { upsert: true, new: true, runValidators: true },
      );
    }
    const response = { job_id: jobId, cv_id: candidateId, questions: questionRecord.questions };
    if (conversation) {
      const createdAt = new Date();
      const assistantMessage = questionRecord.questions.map((item, index) => [
        `${index + 1}. ${item.question}`,
        `Category: ${item.category}`,
        `Reason: ${item.reason}`,
        `Related evidence: ${item.related_evidence}`,
        `Evaluation guidance: ${item.evaluation_guidance}`,
      ].join('\n')).join('\n\n');
      const messages = [
        ...(conversation.messages || []),
        { role: 'user', content: 'Generate tailored interview questions for this candidate.', created_at: createdAt },
        { role: 'assistant', content: assistantMessage, created_at: new Date() },
      ];
      conversation.messages = messages;
      if (!conversation.title || conversation.title === 'New conversation') conversation.title = 'Interview questions';
      conversation.updated_at = new Date();
      if (useMemory()) {
        const store = getStore();
        const index = store.recruitmentConversations.findIndex((item) =>
          item.job_id === jobId && item.candidate_id === candidateId
          && item.conversation_id === conversation.conversation_id);
        if (index >= 0) store.recruitmentConversations[index] = conversation;
      } else {
        await conversation.save();
      }
      response.conversation_id = conversation.conversation_id || String(conversation._id || conversationId);
      response.title = conversation.title;
      response.messages = messages;
    }
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to generate candidate interview questions.' });
  }
};

const evaluateCV = async (req, res) => {
  try {
    const { cv_id, job_id } = req.body;

    if (!cv_id || !job_id) {
      return res.status(400).json({ message: 'cv_id and job_id are required.' });
    }

    let cv = null;
    let job = null;

    if (useMemory()) {
      const store = getStore();
      cv = store.cvs.find((item) => item.cv_id === cv_id && item.job_id === job_id);
      job = store.jobs.find((item) => item.job_id === job_id);
    } else {
      cv = await CV.findOne({ cv_id, job_id });
      job = await Job.findOne({ job_id });
    }

    if (!cv) {
      return res.status(404).json({ message: 'CV not found.' });
    }

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const evaluation = await evaluateWithOpenRouter(cv.cv_text, job.responsibilities || job.description, job.rubric);
    const evaluationId = generateId('eval');

    const result = {
      evaluation_id: evaluationId,
      cv_id,
      job_id,
      final_score: evaluation.final_score,
      details: evaluation.details,
      feedback: evaluation.feedback,
      claude_response: JSON.stringify(evaluation),
      evaluated_at: new Date().toISOString(),
    };

    if (useMemory()) {
      getStore().evaluations.unshift(result);
      const target = getStore().cvs.find((item) => item.cv_id === cv_id);
      if (target) target.status = 'evaluated';
      return res.status(201).json({ score: evaluation.final_score, feedback: evaluation.feedback, details: evaluation.details });
    }

    await Evaluation.create(result);
    cv.status = 'evaluated';
    await cv.save();

    return res.status(201).json({
      score: evaluation.final_score,
      feedback: evaluation.feedback,
      details: evaluation.details,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to evaluate CV.' });
  }
};

module.exports = { evaluateCV, analyzeJobCVs, matchJobCVs, generateJobQuestions, generateCandidateQuestions };
