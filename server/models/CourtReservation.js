import mongoose from "mongoose";

const courtReservationSchema = new mongoose.Schema({
  court: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g. "10:00 - 11:00"
});

export default mongoose.model("CourtReservation", courtReservationSchema);
