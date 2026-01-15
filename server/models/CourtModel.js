import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, enum: ["football", "basketball", "tennis"], required: true },
});

export default mongoose.model("Court", courtSchema);
