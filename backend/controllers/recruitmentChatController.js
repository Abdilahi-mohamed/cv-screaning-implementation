const mongoose = require('mongoose');
const CV = require('../models/CV');
const Evaluation = require('../models/Evaluation');
const Job = require('../models/Job');
const RecruitmentConversation = require('../models/RecruitmentConversation');
const { getStore } = require('../data/store');
const { generateRecruitmentChatReply } = require('../services/openRouterService');
const { generateId } = require('../utils/helpers');

const useMemory = () => mongoose.connection.readyState !== 1;

const findContext = async (jobId, candidateId) => {
  if (useMemory()) {
    const store = getStore();
    return {
      job: store.jobs.find((item) => item.job_id === jobId),
      candidate: store.cvs.find((item) => item.cv_id === candidateId && item.job_id === jobId),
      evaluation: store.evaluations.find((item) => item.cv_id === candidateId && item.job_id === jobId),
      conversation: store.recruitmentConversations.find((item) => item.candidate_id === candidateId && item.job_id === jobId),
    };
  }

  const [job, candidate, evaluation, conversation] = await Promise.all([
    Job.findOne({ job_id: jobId }),
    CV.findOne({ cv_id: candidateId, job_id: jobId }),
    Evaluation.findOne({ cv_id: candidateId, job_id: jobId }),
    RecruitmentConversation.findOne({ candidate_id: candidateId, job_id: jobId }),
  ]);
  return { job, candidate, evaluation, conversation };
};

const listConversations = async (jobId, candidateId) => {
  if (useMemory()) {
    return getStore().recruitmentConversations
      .filter((item) => item.job_id === jobId && item.candidate_id === candidateId)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  const conversations = await RecruitmentConversation.find({ job_id: jobId, candidate_id: candidateId })
    .sort({ updated_at: -1 })
    .lean();
  return conversations.map((item) => ({
    ...item,
    conversation_id: item.conversation_id || String(item._id),
  }));
};

const loadConversation = async (jobId, candidateId, conversationId) => {
  if (useMemory()) {
    return getStore().recruitmentConversations.find((item) =>
      item.job_id === jobId && item.candidate_id === candidateId && item.conversation_id === conversationId);
  }

  const byId = await RecruitmentConversation.findOne({ job_id: jobId, candidate_id: candidateId, conversation_id: conversationId });
  if (byId) return byId;
  if (!mongoose.Types.ObjectId.isValid(conversationId)) return null;
  const legacy = await RecruitmentConversation.findOne({ job_id: jobId, candidate_id: candidateId, _id: conversationId });
  return legacy;
};

const getCandidateChats = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const { job, candidate } = await findContext(jobId, candidateId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this job.' });
    const conversations = await listConversations(jobId, candidateId);
    return res.json({
      job_id: jobId,
      candidate_id: candidateId,
      conversations: conversations.map((item) => {
        const lastMessage = item.messages?.[item.messages.length - 1];
        return {
          conversation_id: item.conversation_id || String(item._id || generateId('chat')),
          title: item.title || item.messages?.find((message) => message.role === 'user')?.content?.slice(0, 64) || 'Previous conversation',
          created_at: item.created_at || item.updated_at,
          updated_at: item.updated_at,
          message_count: item.messages?.length || 0,
          last_message: lastMessage?.content || '',
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to load chat history.' });
  }
};

const createCandidateChat = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const { job, candidate } = await findContext(jobId, candidateId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this job.' });
    const now = new Date();
    const conversation = {
      conversation_id: generateId('chat'),
      job_id: jobId,
      candidate_id: candidateId,
      title: 'New conversation',
      messages: [],
      created_at: now,
      updated_at: now,
    };
    if (useMemory()) {
      getStore().recruitmentConversations.push(conversation);
    } else {
      await RecruitmentConversation.create(conversation);
    }
    return res.status(201).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to create a new conversation.' });
  }
};

const getCandidateChatById = async (req, res) => {
  try {
    const { jobId, candidateId, conversationId } = req.params;
    const { job, candidate } = await findContext(jobId, candidateId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this job.' });
    const conversation = await loadConversation(jobId, candidateId, conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found for this candidate.' });
    return res.json({
      conversation_id: conversation.conversation_id || String(conversation._id || conversationId),
      title: conversation.title || 'Previous conversation',
      messages: conversation.messages || [],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to load this conversation.' });
  }
};

const deleteCandidateChat = async (req, res) => {
  try {
    const { jobId, candidateId, conversationId } = req.params;
    const { job, candidate } = await findContext(jobId, candidateId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this job.' });
    const conversation = await loadConversation(jobId, candidateId, conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found for this candidate.' });

    if (useMemory()) {
      const store = getStore();
      store.recruitmentConversations = store.recruitmentConversations.filter((item) =>
        item.job_id !== jobId || item.candidate_id !== candidateId
        || item.conversation_id !== conversation.conversation_id);
    } else {
      await conversation.deleteOne();
    }

    return res.json({ conversation_id: conversation.conversation_id || String(conversation._id || conversationId), deleted: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to delete this conversation.' });
  }
};

const postMessage = async ({ jobId, candidateId, conversation, message, job, candidate, evaluation }) => {
  const messages = [...(conversation.messages || []).map((item) => ({
    role: item.role,
    content: item.content,
    created_at: item.created_at,
  })), { role: 'user', content: message, created_at: new Date() }];
  const reply = await generateRecruitmentChatReply({ candidate, job, evaluation, messages });
  messages.push({ role: 'assistant', content: reply, created_at: new Date() });
  const savedMessages = messages;
  const title = conversation.title && conversation.title !== 'New conversation'
    ? conversation.title
    : message.slice(0, 64);
  const updatedAt = new Date();

  if (useMemory()) {
    const store = getStore();
    const index = store.recruitmentConversations.findIndex((item) =>
      item.job_id === jobId && item.candidate_id === candidateId
      && item.conversation_id === conversation.conversation_id);
    const updated = { ...conversation, title, messages: savedMessages, updated_at: updatedAt };
    if (index >= 0) store.recruitmentConversations[index] = updated;
    else store.recruitmentConversations.push(updated);
  } else {
    conversation.title = title;
    conversation.messages = savedMessages;
    conversation.updated_at = updatedAt;
    if (!conversation.conversation_id) conversation.conversation_id = generateId('chat');
    await conversation.save();
  }
  return savedMessages;
};

const postCandidateChatMessage = async (req, res) => {
  try {
    const { jobId, candidateId, conversationId } = req.params;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 2000) return res.status(400).json({ message: 'Enter a message of 1 to 2,000 characters.' });
    const { job, candidate, evaluation } = await findContext(jobId, candidateId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this job.' });
    const conversation = await loadConversation(jobId, candidateId, conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found for this candidate.' });
    const messages = await postMessage({ jobId, candidateId, conversation, message, job, candidate, evaluation });
    return res.json({ conversation_id: conversation.conversation_id || conversationId, job_id: jobId, candidate_id: candidateId, messages });
  } catch (error) {
    return res.status(502).json({ message: error.message || 'Unable to get an AI response. Please try again.' });
  }
};

const getCandidateChat = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const { job, candidate, conversation } = await findContext(jobId, candidateId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this job.' });
    return res.json({ job_id: jobId, candidate_id: candidateId, messages: conversation?.messages || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to load the candidate conversation.' });
  }
};

const postCandidateChat = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 2000) {
      return res.status(400).json({ message: 'Enter a message of 1 to 2,000 characters.' });
    }

    const { job, candidate, evaluation, conversation } = await findContext(jobId, candidateId);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found for this job.' });

    const targetConversation = conversation || {
      conversation_id: generateId('chat'),
      job_id: jobId,
      candidate_id: candidateId,
      title: 'New conversation',
      messages: [],
      created_at: new Date(),
      updated_at: new Date(),
      save: async function save() {
        await RecruitmentConversation.create(this);
      },
    };
    const savedMessages = await postMessage({ jobId, candidateId, conversation: targetConversation, message, job, candidate, evaluation });
    return res.json({ job_id: jobId, candidate_id: candidateId, conversation_id: targetConversation.conversation_id, messages: savedMessages });
  } catch (error) {
    return res.status(502).json({ message: error.message || 'Unable to get an AI response. Please try again.' });
  }
};

module.exports = {
  getCandidateChat,
  postCandidateChat,
  getCandidateChats,
  createCandidateChat,
  getCandidateChatById,
  deleteCandidateChat,
  postCandidateChatMessage,
};
