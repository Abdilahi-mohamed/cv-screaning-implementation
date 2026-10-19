const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema({
  ranking_id: { type: String, required: true, unique: true },
  job_id: { type: String, required: true },
  candidate_id: { type: String, required: true },
  evaluation_id: { type: String, required: true },
  overall_score: { type: Number, default: 0 },
  recommendation: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Ranking || mongoose.model('Ranking', rankingSchema);