import express from "express";
import { authMiddleware, requireAdmin } from "../middleware/AuthMiddleware.js";
import { getAllWorkshops } from "../controllers/workshopcontroller.js"; // Make sure this import exists
import { sendCertificatesForWorkshop, markWorkshopAttended } from "../controllers/certificateController.js";

const router = express.Router();

router.get("/admin", authMiddleware, requireAdmin, getAllWorkshops);

// You can add more admin-specific routes here
router.get("/admin/users", authMiddleware, requireAdmin, (req, res) => {
  // This would be handled by UserController in practice
  res.json({ message: "Admin users route" });
});

router.post("/admin/workshops/:workshopId/send-certificates", authMiddleware, requireAdmin, sendCertificatesForWorkshop);

// Route to mark a specific user as 'attended' for a specific workshop
router.post("/admin/workshops/:workshopId/mark-attended/:userId", authMiddleware, requireAdmin, markWorkshopAttended);

export default router;