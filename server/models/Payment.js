import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['workshop', 'trip', 'wallet_topup', 'booth', 'bazaar'], // 🆕 ADD wallet_topup, booth, bazaar
    required: function () {
      // Only require eventType for workshop/trip payments, not wallet top-ups
      return this.eventType !== 'wallet_topup';
    }
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function () {
      // Only require eventId for workshop/trip payments, not wallet top-ups
      return this.eventType && this.eventType !== 'wallet_topup';
    },
    refPath: 'eventType'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'wallet'],
    required: true
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  cancellationReason: String,
  cancelledAt: Date,
  receiptUrl: String,

  // 🆕 ADD: Additional fields for wallet top-ups
  topUpDescription: {
    type: String,
    default: ''
  },
  isWalletTopUp: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 🆕 ADD: Pre-save middleware to handle wallet top-ups
PaymentSchema.pre('save', function (next) {
  if (this.eventType === 'wallet_topup') {
    this.isWalletTopUp = true;
    if (!this.topUpDescription) {
      this.topUpDescription = 'Wallet top-up via Stripe';
    }
  }
  next();
});

export default mongoose.model('Payment', PaymentSchema);