import express from "express";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import {
  getCourts,
  getCourtSchedule,
  reserveCourt
} from "../controllers/CourtController.js";

const router = express.Router();

router.get("/", authMiddleware, getCourts);
router.get("/:courtId/schedule", authMiddleware, getCourtSchedule);
router.post("/:courtId/reserve", authMiddleware, reserveCourt);

export default router;
