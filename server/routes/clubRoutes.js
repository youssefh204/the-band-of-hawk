import express from "express";
import {
  createClub,
  deleteClub,
  joinClub,
  leaveClub,
  getAllClubs,
  getClubById
} from "../controllers/clubController.js";

import authMiddleware, { requireAdmin } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// Admin create club
router.post("/create", authMiddleware, requireAdmin, createClub);

// Admin delete club
router.delete("/:clubId/delete", authMiddleware, requireAdmin, deleteClub);

// Get all clubs
router.get("/", getAllClubs);

// Get one club
router.get("/:clubId", getClubById);

// Join club
router.post("/:clubId/join", authMiddleware, joinClub);

// Leave club
router.post("/:clubId/leave", authMiddleware, leaveClub);

export default router;
