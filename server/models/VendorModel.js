import mongoose from "mongoose";

const vendorschema = new mongoose.Schema(
    {companyName: {type: String, required: true,},
     email: {type: String,required: true},
     password: {type: String, required:true, minlnegth:6},
     role: {type: String, enum: ["vendor"]},
     verifyToken: { type: String, default: "" },
     verifyTokenExpiry: { type: Number, default: 0 },
     isApproved:{type: Boolean, default: false},
     isAccountVerified: { type: Boolean, default: false },
     resetOtp: { type: String, default: "" },
     resetOtpExpireAt: { type: Number, default: 0 },
     logo: { type: String, default: "" },
    taxCard: { type: String, default: "" },

  },
  { timestamps: true }
);
const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorschema);
export default Vendor;