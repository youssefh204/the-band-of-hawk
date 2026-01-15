import express from "express";
import { generateTicket, scanTicket } from "../controllers/ticketController.js";

const router = express.Router();

// Generate QR ticket
router.post("/:eventType/:eventId", generateTicket);

// Scan ticket & check-in
router.post("/checkin/:eventType/:eventId/:ticketId", scanTicket);

export default router;
