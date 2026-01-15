// routes/favoritesRoutes.js
import express from "express";
import { 
  addWorkshopToFavorites,
  addTripToFavorites,
  removeWorkshopFromFavorites,
  removeTripFromFavorites,
  getFavorites,
  checkFavoriteStatus
} from "../controllers/favoritesController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Add to favorites
router.post("/:userId/favorites/workshops", addWorkshopToFavorites);
router.post("/:userId/favorites/trips", addTripToFavorites);

// Remove from favorites
router.delete("/:userId/favorites/workshops/:workshopId", removeWorkshopFromFavorites);
router.delete("/:userId/favorites/trips/:tripId", removeTripFromFavorites);

// Get favorites
router.get("/:userId/favorites", getFavorites);

// Check favorite status
router.get("/:userId/favorites/check", checkFavoriteStatus);

export default router;