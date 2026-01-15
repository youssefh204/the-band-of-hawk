import mongoose from "mongoose";

const clubEventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true, trim: true },
    Description: { type: String, default: "" },

    // The club that created the event
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true
    },

    // Optional: person who submitted event (club head / admin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Date for the actual event
    eventDate: { type: Date, required: true },

    // STATUS FIELD ⭐
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    },

    // Optional fields for admin feedback
    adminMessage: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("ClubEvent", clubEventSchema);
