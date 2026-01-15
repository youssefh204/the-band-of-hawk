import mongoose from "mongoose";

const ConferenceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    shortDescription: { type: String, default: "" },
    agenda: { type: String, default: "" },
    websiteLink: { type: String, default: "" },
    budget: { type: Number, default: 0 },
    fundingSource: { type: String, enum: ["external", "GUC"], default: "GUC" },
    resources: { type: String, default: "" },

    // Optional parity with Workshop
    status: { type: String, enum: ["pending","approved","rejected","needs-edits"], default: "pending" },
    reviewNote: { type: String, default: "" },
    published: { type: Boolean, default: false },
    registrationsCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true, default: "Admin" },
    registeredUsers: [
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["registered", "attended", "cancelled"],
      default: "registered"
    },
    registeredAt: { type: Date, default: Date.now }
  }
],


    // Allowed roles for this conference
    allowedRoles: {
      type: [String],
      default: []
    }
    ,
    externalTokens: [
      {
        token: { type: String },
        createdAt: { type: Date, default: Date.now },
        used: { type: Boolean, default: false },
        visitorName: { type: String, default: '' }
      }
    ],
    tickets: [{
  ticketId: String,
  scanned: { type: Boolean, default: false },
  scannedAt: Date
}]

  },
  { timestamps: true }
);

export default mongoose.model("Conference", ConferenceSchema);
