import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    author: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'authorModel' },
      name: { type: String, required: true }
    },
    authorModel: {
      type: String,
      required: true,
      enum: ['User', 'Vendor']
    },
    eventType: {
      type: String,
      required: true,
      enum: ['Workshop', 'Trip', 'Bazaar', 'Conference', 'GymSession']
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'eventType'
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Index for efficient queries
CommentSchema.index({ eventType: 1, eventId: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model('Comment', CommentSchema);