const mongoose = require('mongoose');
const { generateId } = require('../utils/helpers');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
}, { _id: false });

const recruitmentConversationSchema = new mongoose.Schema({
  conversation_id: { type: String, default: () => generateId('chat'), unique: true, sparse: true },
  job_id: { type: String, required: true },
  candidate_id: { type: String, required: true },
  title: { type: String, default: 'New conversation' },
  messages: { type: [messageSchema], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

recruitmentConversationSchema.index({ job_id: 1, candidate_id: 1, updated_at: -1 });

module.exports = mongoose.models.RecruitmentConversation
  || mongoose.model('RecruitmentConversation', recruitmentConversationSchema);
