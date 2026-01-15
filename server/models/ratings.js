import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
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
      enum: ["Workshop", "Trip"], // extend later if needed
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure 1 rating per (user, event)
ratingSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
