const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  token_hash: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['owner', 'hr'], required: true },
  expires_at: { type: Date, required: true, index: { expires: 0 } },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Session || mongoose.model('Session', sessionSchema);
