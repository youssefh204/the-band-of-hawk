import express from "express";
import {
  createOrUpdateRating,
  getUserRatings,
  getEventRating,
  getEventReviews
} from "../controllers/ratingController.js";

const router = express.Router();

// POST /ratings  -> create or update rating for a user+event
router.post("/", createOrUpdateRating);

// GET /ratings/user/:userId -> all ratings of that user
router.get("/user/:userId", getUserRatings);

// GET /ratings/event/:eventId -> avg rating + count for event
router.get("/event/:eventId", getEventRating);
router.get("/event/:eventId/reviews", getEventReviews);


export default router;
