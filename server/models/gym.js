import mongoose from "mongoose";

const GymSessionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Yoga", "Pilates", "Aerobics", "Zumba", "Cross Circuit", "Kick-boxing"],
    required: true,
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
  },
  currentParticipants: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "cancelled"],
    default: "active",
  },
});

GymSessionSchema.methods.canJoin = function () {
  return this.status === "active" && this.currentParticipants < this.maxParticipants;
};

// Optional static helper
GymSessionSchema.statics.findAvailable = function () {
  return this.find({ status: "active", $expr: { $lt: ["$currentParticipants", "$maxParticipants"] } });
};

export default mongoose.model("GymSession", GymSessionSchema);
