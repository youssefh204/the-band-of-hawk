import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder where uploads live
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// GET all uploaded files
router.get("/", (req, res) => {
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) return res.status(500).json({ success: false, message: "Failed reading uploads" });

    const fileUrls = files.map(file => ({
      file,
      url: `/uploads/${file}`,
    }));

    res.json({ success: true, data: fileUrls });
  });
});
router.get("/download/:file", (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  return res.download(filePath); // ⬅ Forces browser to download
});


export default router;
