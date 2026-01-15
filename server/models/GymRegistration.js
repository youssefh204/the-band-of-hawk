import mongoose from "mongoose";

const GymRegistrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: "GymSession", required: true },
  status: {
    type: String,
    enum: ["registered", "cancelled"],
    default: "registered"
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate registrations
GymRegistrationSchema.index({ user: 1, session: 1 }, { unique: true });

export default mongoose.model("GymRegistration", GymRegistrationSchema);
