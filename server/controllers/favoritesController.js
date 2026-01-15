// controllers/favoritesController.js
import User from "../models/userModel.js";
import Workshop from "../models/Workshop.js";
import Trip from "../models/TripModel.js";

// Add workshop to favorites
export const addWorkshopToFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const { workshopId } = req.body;

    // Check if user is modifying their own favorites
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only modify your own favorites"
      });
    }

    // Check if workshop exists
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.addWorkshopToFavorites(workshopId);

    res.status(200).json({
      success: true,
      message: "Workshop added to favorites",
      data: {
        favorites: user.favorites
      }
    });
  } catch (error) {
    console.error("Add workshop to favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding workshop to favorites"
    });
  }
};

// Add trip to favorites
export const addTripToFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tripId } = req.body;

    // Check if user is modifying their own favorites
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only modify your own favorites"
      });
    }

    // Check if trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.addTripToFavorites(tripId);

    res.status(200).json({
      success: true,
      message: "Trip added to favorites",
      data: {
        favorites: user.favorites
      }
    });
  } catch (error) {
    console.error("Add trip to favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding trip to favorites"
    });
  }
};

// Remove workshop from favorites
export const removeWorkshopFromFavorites = async (req, res) => {
  try {
    const { userId, workshopId } = req.params;

    // Check if user is modifying their own favorites
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only modify your own favorites"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.removeWorkshopFromFavorites(workshopId);

    res.status(200).json({
      success: true,
      message: "Workshop removed from favorites",
      data: {
        favorites: user.favorites
      }
    });
  } catch (error) {
    console.error("Remove workshop from favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing workshop from favorites"
    });
  }
};

// Remove trip from favorites
export const removeTripFromFavorites = async (req, res) => {
  try {
    const { userId, tripId } = req.params;

    // Check if user is modifying their own favorites
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only modify your own favorites"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.removeTripFromFavorites(tripId);

    res.status(200).json({
      success: true,
      message: "Trip removed from favorites",
      data: {
        favorites: user.favorites
      }
    });
  } catch (error) {
    console.error("Remove trip from favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing trip from favorites"
    });
  }
};

// Get user's favorites list
export const getFavorites = async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only view their own favorites
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own favorites"
      });
    }

    const user = await User.findById(userId)
      .populate('favorites.workshops')
      .populate('favorites.trips');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        workshops: user.favorites.workshops,
        trips: user.favorites.trips,
        count: user.favoritesCount
      }
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching favorites"
    });
  }
};

// Check if event is in favorites
export const checkFavoriteStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { workshopId, tripId } = req.query;

    // Users can only check their own favorites status
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only check your own favorites"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let isFavorite = false;
    let eventType = '';

    if (workshopId) {
      isFavorite = user.isWorkshopInFavorites(workshopId);
      eventType = 'workshop';
    } else if (tripId) {
      isFavorite = user.isTripInFavorites(tripId);
      eventType = 'trip';
    } else {
      return res.status(400).json({
        success: false,
        message: "Either workshopId or tripId is required"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isFavorite,
        eventType,
        [eventType === 'workshop' ? 'workshopId' : 'tripId']: workshopId || tripId
      }
    });
  } catch (error) {
    console.error("Check favorite status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking favorite status"
    });
  }
};