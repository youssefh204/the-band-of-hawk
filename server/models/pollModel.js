import mongoose from "mongoose";

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true },

  vendors: [
    {
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] // array of users who voted for this vendor
    }
  ],

  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // prevents multiple votes

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  isResolved: { type: Boolean, default: false },
  winningVendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null }

}, { timestamps: true });

export default mongoose.model("Poll", pollSchema);
