import express from "express";
import { authMiddleware, requireEventOffice } from "../middleware/AuthMiddleware.js";
import { createPoll, getPolls, votePoll, finalizePoll } from "../controllers/pollController.js";

const router = express.Router();

router.get("/", authMiddleware, getPolls);
router.post("/", authMiddleware, requireEventOffice, createPoll);
router.post("/vote", authMiddleware, votePoll);
router.post("/:id/finalize", authMiddleware, requireEventOffice, finalizePoll);

export default router;
