import crypto from "crypto";
import userModel from "../models/userModel";

const token = crypto.randomBytes(32).toString("hex");
userModel.verifyToken= token;
userModel.verifyTokenExpiry= Date.now()+1000*60*60;
await userModel.save();