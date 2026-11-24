const mongoose = require('mongoose');

const paymentRegistrationSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  company_id: { type: String, required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  amount: { type: Number, required: true, default: 25, min: 25 },
  provider: {
    type: String,
    enum: ['ZAAD', 'eDahab', 'Bank Transfer', 'Golis', 'Hormuud'],
    required: true,
  },
  sender_account: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Paid', 'Failed'],
    default: 'Pending',
  },
  gateway_reference: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.PaymentRegistration || mongoose.model('PaymentRegistration', paymentRegistrationSchema);
