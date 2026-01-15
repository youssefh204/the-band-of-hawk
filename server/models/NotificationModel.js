import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // ==============================
  // 🔹 SHARED FIELDS (Always used)
  // ==============================
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  type: { 
    type: String, 
    enum: ['info', 'alert', 'success', 'warning', 'error'], 
    default: 'info' 
  },

  // ============================================
  // 🎯 SCENARIO A: DIRECT MESSAGE (Specific User)
  // Used for: "Your workshop is approved"
  // ============================================
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: false // ⚠️ IMPORTANT: Optional so Broadcasts work!
  },
  isRead: { type: Boolean, default: false },

  // ============================================
  // 📢 SCENARIO B: BROADCAST (Many Users)
  // Used for: "Announcement to all Students"
  // ============================================
  userRoles: [{ 
    type: String, 
    enum: ["student", "staff", "ta", "professor", "eventoffice", "admin"] 
  }],
  link: { type: String, default: "" }, 
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] // Tracks who saw the broadcast

});

// 👇 THE CRASH FIX: Checks if model exists before creating it
const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;