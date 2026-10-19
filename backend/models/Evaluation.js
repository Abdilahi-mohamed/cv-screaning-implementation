const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  evaluation_id: { type: String, required: true, unique: true },
  cv_id: { type: String, required: true },
  job_id: { type: String, required: true },
  final_score: { type: Number, default: 0 },
  details: {
    skills_score: { type: Number, default: 0 },
    experience_score: { type: Number, default: 0 },
    education_score: { type: Number, default: 0 },
    communication_score: { type: Number, default: 0 },
  },
  feedback: { type: String, default: '' },
  matched_requirements: { type: [String], default: [] },
  missing_requirements: { type: [String], default: [] },
  claude_response: { type: String, default: '' },
  evaluated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);
