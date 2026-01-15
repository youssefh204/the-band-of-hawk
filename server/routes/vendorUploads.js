import express from "express";
import { upload } from "../middleware/upload.js";
import Vendor from "../models/VendorModel.js";
import authMiddleware from "../middleware/AuthMiddleware.js";

const router = express.Router();

// ----------------------------
// Upload Logo
// ----------------------------
router.post(
  "/upload-logo",
  authMiddleware,
  upload.single("logo"),
  async (req, res) => {
    try {
      const vendorId = req.user.id;

      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const fileUrl = `/uploads/${req.file.filename}`;

      await Vendor.findByIdAndUpdate(vendorId, {
        logo: fileUrl,
      });

      res.json({
        url: `http://localhost:4000/uploads/${req.file.filename}`
      });
    } catch (err) {
      console.error("Logo upload error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ----------------------------
// Upload Tax Card
// ----------------------------
router.post(
  "/upload-taxcard",
  authMiddleware,
  upload.single("taxCard"),
  async (req, res) => {
    try {
      const vendorId = req.user.id;

      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const fileUrl = `/uploads/${req.file.filename}`;

      await Vendor.findByIdAndUpdate(vendorId, {
        taxCard: fileUrl,
      });

      res.json({
        url: `http://localhost:4000/uploads/${req.file.filename}`
      });
    } catch (err) {
      console.error("Tax card upload error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ----------------------------
// Upload Attendee ID Documents
// ----------------------------
router.post(
  "/upload-attendee-ids",
  authMiddleware,
  upload.array("idDocuments", 10), // Allow up to 10 files
  async (req, res) => {
    try {
      const { applicationId, attendeeIndex } = req.body;
      const vendorId = req.user.id;

      if (!applicationId) {
        return res.status(400).json({ message: "Application ID is required" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Import Application model
      const Application = (await import("../models/application.js")).default;

      // Find the application
      const application = await Application.findOne({
        _id: applicationId,
        vendorId: vendorId
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Update attendee ID documents
      const uploadedFiles = req.files.map((file, index) => ({
        fileUrl: `/uploads/${file.filename}`,
        index: attendeeIndex ? parseInt(attendeeIndex) + index : index
      }));

      // Update each attendee's idDocumentUrl
      uploadedFiles.forEach(({ fileUrl, index }) => {
        if (application.attendees[index]) {
          application.attendees[index].idDocumentUrl = fileUrl;
        }
      });

      await application.save();

      res.json({
        success: true,
        message: "ID documents uploaded successfully",
        files: uploadedFiles
      });
    } catch (err) {
      console.error("ID document upload error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
