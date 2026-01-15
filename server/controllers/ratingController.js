import mongoose from "mongoose";
import Rating from "../models/ratings.js";
import Workshop from "../models/Workshop.js";
import Trip from "../models/TripModel.js";
import User from "../models/userModel.js"; // adjust path if needed

// Helper: recalculate and store average rating on the event document
async function updateAverageRating(eventId, eventType) {
  const stats = await Rating.aggregate([
    {
      $match: {
        eventId: new mongoose.Types.ObjectId(eventId),
      },
    },
    {
      $group: {
        _id: "$eventId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const avg = stats[0]?.avgRating || 0;

  if (eventType === "Workshop") {
    await Workshop.findByIdAndUpdate(eventId, { averageRating: avg });
  } else if (eventType === "Trip") {
    await Trip.findByIdAndUpdate(eventId, { averageRating: avg });
  }

  return avg;
}

// ✅ Create or update a rating
export const createOrUpdateRating = async (req, res) => {
  try {
    const { userId, eventId, eventType, rating } = req.body;

    if (!userId || !eventId || !eventType || !rating) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Optional but GOOD: only allow rating if user joined event
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

        // Check if user is registered for this event
       // Check if user is registered for this event using attendedEvents
            let joined = false;

            if (eventType === "Workshop") {
            joined = (user.attendedEvents?.workshops || []).some(w =>
                String(w._id || w) === String(eventId)
            );
            } else if (eventType === "Trip") {
            joined = (user.attendedEvents?.trips || []).some(t =>
                String(t._id || t) === String(eventId)
            );
            }

            if (!joined) {
            return res.status(403).json({
                message: "You must be registered for this event to rate it"
            });
            }



    // Upsert rating
    const rated = await Rating.findOneAndUpdate(
      { userId, eventId },
      { rating, eventType },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const avg = await updateAverageRating(eventId, eventType);

    res.status(201).json({
      message: "Rating saved",
      data: {
        ...rated.toObject(),
        averageRating: avg,
      },
    });
  } catch (err) {
    console.error("Rating error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all ratings by a specific user (for persistence on frontend)
export const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await Rating.find({ userId });

    res.json({ data: ratings });
  } catch (err) {
    console.error("Get user ratings error:", err);
    res.status(500).json({ message: err.message });
  }
};
// ⭐ Fetch all ratings + avg for UI with reviews list
export const getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;

    const ratings = await Rating.find({ eventId })
      .populate("userId", "name") // show reviewer names
      .lean();

    const ratingsCount = ratings.length;
    const avgRating =
      ratingsCount > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsCount
        : 0;

    res.json({
      avgRating: Number(avgRating.toFixed(1)),
      ratingsCount,
      ratings: ratings.map((r) => ({
        _id: r._id,
        rating: r.rating,
        user: r.userId?.name || "Anonymous",
      })),
    });
  } catch (err) {
    console.error("Error fetching event reviews:", err);
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get average rating for one event
export const getEventRating = async (req, res) => {
  try {
    const { eventId } = req.params;
    const ratings = await Rating.find({ eventId });

    const avg =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    res.json({ averageRating: Number(avg.toFixed(1)), count: ratings.length });
  } catch (err) {
    console.error("Get event rating error:", err);
    res.status(500).json({ message: err.message });
  }
};
