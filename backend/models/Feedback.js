const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  feedback_id: { type: String, required: true, unique: true },
  cv_id: { type: String, required: true },
  job_id: { type: String, required: true },
  manager_decision: {
    type: String,
    enum: ['shortlist', 'reject'],
    required: true,
  },
  manager_notes: { type: String, default: '' },
  manager_id: { type: String, default: 'manager_001' },
  decision_date: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
