const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  allow_public_applications: { type: Boolean, default: true },
  default_brand_color: { type: String, default: '#2f6f9f' },
  updated_by: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.SystemSetting || mongoose.model('SystemSetting', systemSettingSchema);
