const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
  question_id: { type: String, required: true, unique: true },
  candidate_id: { type: String, required: true },
  job_id: { type: String, required: true },
  candidate_name: { type: String, default: '' },
  questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.InterviewQuestion || mongoose.model('InterviewQuestion', interviewQuestionSchema);