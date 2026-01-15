import QRCode from "qrcode";
import crypto from "crypto";
import Bazaar from "../models/bazaarModel.js";
import Conference from "../models/Conference.js";

const getModel = (type) => type === "bazaar" ? Bazaar : Conference;

// 🎫 Generate Single Ticket
export const generateTicket = async (req, res) => {
  const { eventType, eventId } = req.params;
  try {
    const Model = getModel(eventType);
    const event = await Model.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const ticketId = crypto.randomBytes(8).toString("hex");
    event.tickets.push({ ticketId });
    await event.save();

    const qrUrl = `${process.env.CLIENT_URL}/scan/${eventType}/${event._id}/${ticketId}`;
    const qrImage = await QRCode.toDataURL(qrUrl);

    res.json({ qr: qrImage, ticketId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "QR Generation Failed" });
  }
};

// 📍 Scan Ticket
export const scanTicket = async (req, res) => {
  const { eventType, eventId, ticketId } = req.params;
  try {
    const Model = getModel(eventType);
    const event = await Model.findById(eventId);

    if (!event) return res.status(404).json({ success: false, message: "Invalid Event" });

    const ticket = event.tickets.find(t => t.ticketId === ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Invalid Ticket" });
    }

    if (ticket.scanned) {
      return res.json({ success: false, message: "Ticket already used ❌" });
    }

    ticket.scanned = true;
    ticket.scannedAt = new Date();

    await event.save();
    res.json({ success: true, message: "Welcome! Ticket checked in 🎉" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Check-In Failed" });
  }
};
