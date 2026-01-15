import Court from "../models/CourtModel.js";
import CourtReservation from "../models/CourtReservation.js";

export const getCourts = async (req, res) => {
  const courts = await Court.find();
  res.json({ success: true, data: courts });
};

export const getCourtSchedule = async (req, res) => {
  const { courtId } = req.params;
  const reservations = await CourtReservation.find({ court: courtId });
  res.json({ success: true, data: reservations });
};

export const reserveCourt = async (req, res) => {
  const { courtId } = req.params;
  const { date, timeSlot } = req.body;

  // Prevent double-booking
  const existing = await CourtReservation.findOne({ court: courtId, date, timeSlot });
  if (existing) {
    return res.status(400).json({ success: false, message: "Already booked" });
  }

  const reservation = await CourtReservation.create({
    court: courtId,
    user: req.user.id,
    date,
    timeSlot,
  });

  res.json({ success: true, message: "Reserved successfully!", data: reservation });
};
