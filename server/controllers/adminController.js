import Workshop from "../models/Workshop.js";
import User from "../models/userModel.js";
import { generateCertificate } from "../utils/certificateGenerator.js";
import { sendCertificateEmail } from "../config/emailTemplates.js";
import mongoose from "mongoose"; // Import mongoose to generate ObjectId

export const sendCertificatesForWorkshop = async (req, res) => {
  try {
    const { workshopId } = req.params;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ success: false, message: "Workshop not found" });
    }

    // Find all users who registered and completed this workshop
    const attendees = await User.find({
      "attendedEvents.workshops": workshopId,
    });

    if (attendees.length === 0) {
      return res.status(404).json({ success: false, message: "No attendees found for this workshop." });
    }

    for (const attendee of attendees) {
      const certificateId = new mongoose.Types.ObjectId().toString(); // Generate a unique ID
      const certificatePath = await generateCertificate(
        attendee, // Pass the attendee object
        workshop, // Pass the workshop object
        certificateId
      );

      // certificatePath already returns the full relative URL like /uploads/certificates/filename.pdf
      const certificateUrl = certificatePath; 

      await sendCertificateEmail(
        attendee.email,
        attendee.firstName,
        workshop,
        certificateUrl
      );

      console.log(
        `Certificate sent to ${attendee.email} for workshop ${workshop.workshopName}`
      );
    }

    res.json({
      success: true,
      message: `Certificates sent to ${attendees.length} attendees for workshop ${workshop.workshopName}`,
    });
  } catch (error) {
    console.error("Error sending certificates for workshop:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
