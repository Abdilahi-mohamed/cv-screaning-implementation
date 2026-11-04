const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  allow_public_applications: { type: Boolean, default: true },
  default_brand_color: { type: String, default: '#2f2dd6' },
  max_cv_file_size_mb: { type: Number, enum: [5, 10, 20], default: 10 },
  rejected_retention_months: { type: Number, enum: [6, 12], default: 6 },
  updated_by: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.SystemSetting || mongoose.model('SystemSetting', systemSettingSchema);
