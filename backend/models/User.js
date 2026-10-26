const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, default: '', trim: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  role: { type: String, enum: ['owner', 'hr'], required: true },
  company_id: { type: String, default: null, index: true },
  password_hash: { type: String, required: true, select: false },
  active: { type: Boolean, default: true },
  permissions: { type: [String], default: ['jobs:manage', 'candidates:manage', 'settings:manage'] },
  last_login_at: { type: Date, default: null },
  last_active_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
