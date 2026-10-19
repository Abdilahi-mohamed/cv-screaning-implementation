const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: { type: String, default: '' },
  originalName: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  path: { type: String, default: '' },
  size: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
});

const cvSchema = new mongoose.Schema({
  cv_id: { type: String, required: true, unique: true },
  job_id: { type: String, required: true },
  candidate_name: { type: String, required: true },
  candidate_email: { type: String, default: '' },
  candidate_phone: { type: String, default: '' },
  candidate_address: { type: String, default: '' },
  candidate_linkedin: { type: String, default: '' },
  candidate_city: { type: String, default: '' },
  application_responses: { type: mongoose.Schema.Types.Mixed, default: {} },
  application_documents: { type: [mongoose.Schema.Types.Mixed], default: [] },
  cv_text: { type: String, default: '' },
  cv_file_name: { type: String, default: '' },
  certificate_file_name: { type: String, default: '' },
  kur_file_name: { type: String, default: '' },
  documents: {
    cv: { type: documentSchema, default: null },
    certificate: { type: documentSchema, default: null },
    kur: { type: documentSchema, default: null },
  },
  embedding: { type: [Number], default: [] },
  status: {
    type: String,
    enum: ['pending', 'evaluated', 'shortlisted', 'rejected', 'uploaded'],
    default: 'uploaded',
  },
  similarity_score: { type: Number, default: 0 },
  uploaded_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.CV || mongoose.model('CV', cvSchema);
