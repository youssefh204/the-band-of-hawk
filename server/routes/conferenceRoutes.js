import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/AuthMiddleware.js";
import { 
  createConference, 
  updateConference, 
  getConferenceById, 
  getAllConferences,
  deleteConference // ADD THIS IMPORT
  , generateConferenceQR, registerForConference, unregisterFromConference
} from "../controllers/conferenceController.js";

const router = express.Router();

// Events Office creates & edits
router.post("/", authMiddleware, authorizeRoles("EventOffice"), createConference);
router.put("/:id", authMiddleware, authorizeRoles("EventOffice"), updateConference);
router.delete("/:id", authMiddleware, authorizeRoles("EventOffice"), deleteConference); // ADD THIS ROUTE

// reads (any authenticated user, adjust if you want public)
router.get("/", authMiddleware, getAllConferences);

router.get("/:id", authMiddleware, getConferenceById);
router.post("/:id/unregister", authMiddleware,unregisterFromConference);

router.post("/:id/register", authMiddleware, registerForConference);

// Generate QR for external visitors (EventOffice or Admin)
router.post("/:id/qr", authMiddleware, authorizeRoles("EventOffice", "Admin"), generateConferenceQR);

export default router;