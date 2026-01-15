import express from "express";
import { sendVerificationEmail } from "../config/nodemailer.js";

const router = express.Router();

router.get("/test-mail", async (req, res) => {
  try {
    await sendVerificationEmail("YOUR_EMAIL@gmail.com", "Test User", "test-token");
    res.send("Email sent successfully!");
  } catch (error) {
    console.error("❌ Test email failed:", error);
    res.status(500).send("Email failed.");
  }
});

export default router;
