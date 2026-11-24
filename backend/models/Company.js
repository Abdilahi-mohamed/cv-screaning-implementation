const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  company_id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'active', 'suspended', 'deleted'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Company || mongoose.model('Company', companySchema);
