import express from "express";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import CourtReservation from "../models/CourtReservation.js";

const router = express.Router();

// Get reservations for a court type by selected date
router.get("/:courtType/:date", async (req, res) => {
  const { courtType, date } = req.params;
  const reservations = await CourtReservation.find({ courtType, date });
  res.json({ success: true, data: reservations });
});

// Make a reservation
router.post("/", authMiddleware, async (req, res) => {
  const { courtType, date, timeSlot } = req.body;
  const userId = req.user.id;

  // Check if slot is taken
  const exists = await CourtReservation.findOne({ courtType, date, timeSlot });
  if (exists) {
    return res.status(400).json({
      success: false,
      message: "This time slot is already reserved"
    });
  }

  const reservation = await CourtReservation.create({
    courtType,
    date,
    timeSlot,
    userId
  });

  res.status(201).json({
    success: true,
    message: "Court reserved successfully",
    data: reservation
  });
});

export default router;
