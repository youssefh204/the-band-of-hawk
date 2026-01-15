import express from "express";
import {
  register,
  login,
  logout,
  verifyEmail,
  checkAuth,
  sendVerificationAfterApproval,
  // registerVendor,
  // loginVendor,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";


const authRouter = express.Router(); // ✅ must come first!

// 🧾 Student Auth Routes
authRouter.post("/register", register);
authRouter.post("/login", login);
// In your auth routes file
authRouter.post('/send-verification', sendVerificationAfterApproval);

// 🧾 Vendor Auth Routes (if needed later)
// authRouter.post("/vendor/register", registerVendor);
// authRouter.post("/vendor/login", loginVendor);

// 🧾 Common Routes
authRouter.post("/logout", logout);
authRouter.get("/verify-email", verifyEmail);

// 🧠 Add the “check auth” route *after* router is defined
authRouter.get("/check", authMiddleware, checkAuth);
export default authRouter;
