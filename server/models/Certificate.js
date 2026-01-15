// models/Certificate.js
import mongoose from 'mongoose';

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  workshopName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  sentAt: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance
CertificateSchema.index({ userId: 1 });
CertificateSchema.index({ workshopId: 1 });
CertificateSchema.index({ certificateId: 1 });
CertificateSchema.index({ verificationCode: 1 });

// 🆕 FIXED: Define the model correctly
const Certificate = mongoose.model('Certificate', CertificateSchema);

export default Certificate;