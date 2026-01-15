import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEventStatus,
  deleteEvent
} from "../controllers/clubEventController.js";
import authMiddleware from "../middleware/AuthMiddleware.js";

const router = express.Router();

// MUST MATCH CONTROLLER PARAM NAMES
router.get("/", getAllEvents);
router.get("/:eventId", getEventById);
router.post("/", authMiddleware ,createEvent);
router.put("/:eventId/status", updateEventStatus);
router.delete("/:eventId", deleteEvent);

export default router;
