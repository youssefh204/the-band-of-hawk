import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  // For bazaar applications
  bazaarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bazaar'
  },

  // Vendor information
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Vendor'
  },
  vendorType: {
    type: String,
    required: true,
    enum: ['Vendor']
  },

  // Application type
  type: {
    type: String,
    required: true,
    enum: ['bazaar', 'booth']
  },

  // Booth details
  boothSize: {
    type: String,
    required: true,
    enum: ['2x2', '4x4']
  },

  // For booth applications only
  duration: {
    type: Number, // in weeks
    min: 1,
    max: 4
  },
  location: String,

  // Attendees
  attendees: [{
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    idDocumentUrl: {
      type: String,
      default: ''
    }
  }],

  // Application status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // Admin notes
  adminNotes: String,

  // Payment tracking
  price: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  acceptanceDate: {
    type: Date
  },
  paymentDeadline: {
    type: Date
  }

}, {
  timestamps: true
});

export default mongoose.model('Application', applicationSchema);