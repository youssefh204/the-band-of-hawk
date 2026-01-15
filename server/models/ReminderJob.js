import mongoose from "mongoose";

const reminderJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  eventType: {
    type: String,
    enum: ["workshop", "trip"],
    required: true,
  },
  remindAt: {
    type: Date,
    required: true,
  },
  kind: {
    type: String, // "1d" | "1h"
    enum: ["1d", "1h"],
    required: true,
  },
  message: { type: String, required: true },
  link: { type: String, default: "" },

  sent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

reminderJobSchema.index({ remindAt: 1, sent: 1 });
reminderJobSchema.index({ userId: 1, eventId: 1, kind: 1 }, { unique: true });

export default mongoose.model("ReminderJob", reminderJobSchema);
