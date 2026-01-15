import mongoose from 'mongoose';

const loyaltyApplicationSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  discountRate: { type: Number, required: true }, // percentage
  promoCode: { type: String, required: true, unique: true },
  termsAndConditions: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: { type: String, default: '' },
  type: { type: String, default: 'loyalty' }, // To identify as loyalty application
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('LoyaltyApplication', loyaltyApplicationSchema);
