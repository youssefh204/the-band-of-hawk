import Comment from "../models/CommentModel.js";
import User from "../models/userModel.js";
import Vendor from "../models/VendorModel.js";
import { sendWarningEmail } from "../config/nodemailer.js";
import Workshop from "../models/Workshop.js";
import Trip from "../models/TripModel.js";


// Helper function to get author name and email
const getAuthorInfo = async (userId, userModel) => {
  try {
    if (userModel === 'User') {
      const user = await User.findById(userId).select('firstName lastName email warnings isBlocked');
      return { 
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        email: user?.email,
        userDoc: user
      };
    } else if (userModel === 'Vendor') {
      const vendor = await Vendor.findById(userId).select('companyName email');
      return { 
        name: vendor ? vendor.companyName : 'Unknown Vendor',
        email: vendor?.email,
        userDoc: null
      };
    }
    return { name: 'Unknown', email: null, userDoc: null };
  } catch (error) {
    return { name: 'Unknown', email: null, userDoc: null };
  }
};

// Create a comment
export const createComment = async (req, res) => {
  try {
    const { content, eventType, eventId } = req.body;
    const authorId = req.user.id;
    const authorModel = req.user.accountType === 'vendor' ? 'Vendor' : 'User';

    // Check if user is registered for the event
    if (authorModel === 'User') {
      const user = await User.findById(authorId);
      
      // First check if user is blocked
      if (user.isBlocked) {
        const now = new Date();
        if (user.blockedUntil && user.blockedUntil > now) {
          return res.status(403).json({
            success: false,
            message: `Your account is blocked until ${user.blockedUntil}. You cannot post comments.`
          });
        } else if (!user.blockedUntil) {
          return res.status(403).json({
            success: false,
            message: "Your account is permanently blocked. You cannot post comments."
          });
        }
      }
      
      if (eventType === 'Workshop') {
        const attendedWorkshops = user.attendedEvents?.workshops || [];
        const isRegistered = attendedWorkshops.some(w => String(w) === String(eventId));
        if (!isRegistered) {
          return res.status(403).json({
            success: false,
            message: "You must be registered for this event to post comments."
          });
        }
      } else if (eventType === 'Trip') {
        const attendedTrips = user.attendedEvents?.trips || [];
        const isRegistered = attendedTrips.some(t => String(t) === String(eventId));
        if (!isRegistered) {
          return res.status(403).json({
            success: false,
            message: "You must be registered for this event to post comments."
          });
        }
      }
      // For conferences, we don't check registration
    }

    // Validate required fields
    if (!content || !eventType || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Content, eventType, and eventId are required"
      });
    }

    // Get author name
    const authorInfo = await getAuthorInfo(authorId, authorModel);

    const newComment = new Comment({
      content,
      author: {
        id: authorId,
        name: authorInfo.name
      },
      authorModel,
      eventType,
      eventId
    });

    const savedComment = await newComment.save();
    
    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: savedComment
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create comment",
      error: error.message
    });
  }
};

// Get all comments for an event - Anyone can view comments
export const getEventComments = async (req, res) => {
  try {
    const { eventType, eventId } = req.params;

    const comments = await Comment.find({
      eventType,
      eventId,
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message
    });
  }
};

// Delete comment with warning system (Admin only)
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Only admin can delete comments for moderation
    if (req.user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete inappropriate comments"
      });
    }

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    if (comment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Comment already deleted"
      });
    }

    // Get author info for warning email
    const authorInfo = await getAuthorInfo(comment.author.id, comment.authorModel);

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.deletedBy = adminId;
    await comment.save();

    let responseMessage = "Comment deleted successfully";
    
    // Send warning email if it's a User (not Vendor)
    if (authorInfo.userDoc && authorInfo.email) {
      // Add warning to user's record
      authorInfo.userDoc.warnings.push({
        reason: reason || "Inappropriate comment",
        commentContent: comment.content,
        deletedAt: new Date()
      });

      // Block user if they have 3 or more warnings
      if (authorInfo.userDoc.warnings.length >= 3) {
        authorInfo.userDoc.isBlocked = true;
        authorInfo.userDoc.blockedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week block
      }

      await authorInfo.userDoc.save();

      // Send warning email
      try {
        await sendWarningEmail(
          authorInfo.email, 
          authorInfo.name, 
          comment.content, 
          reason,
          authorInfo.userDoc.warnings.length
        );
      } catch (emailError) {
        console.error("Failed to send warning email:", emailError);
      }
      
      responseMessage += ". Warning issued to user.";
    }

    res.json({
      success: true,
      message: responseMessage
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message
    });
  }
};

export const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 20, eventType, eventId } = req.query;
    
    const filter = { isDeleted: false };
    if (eventType) filter.eventType = eventType;
    if (eventId) filter.eventId = eventId;

    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Attach event names to each comment
    for (let c of comments) {
      if (c.eventType === "Workshop") {
        const w = await Workshop.findById(c.eventId).select("workshopName");
        c.eventName = w?.workshopName || "Unknown Workshop";
        c.displayEvent = `Workshop – ${c.eventName}`;
      } 
      else if (c.eventType === "Trip") {
        const t = await Trip.findById(c.eventId).select("tripName");
        c.eventName = t?.tripName || "Unknown Trip";
        c.displayEvent = `Trip – ${c.eventName}`;
      } 
      else {
        c.eventName = "Unknown Event";
        c.displayEvent = c.eventType;
      }
    }

    const total = await Comment.countDocuments(filter);

    res.json({
      success: true,
      data: comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total
      }
    });
  } catch (error) {
    console.error("Error fetching all comments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message
    });
  }
};


// Get user's own comments
export const getUserComments = async (req, res) => {
  try {
    const userId = req.user.id;
    const authorModel = req.user.accountType === 'vendor' ? 'Vendor' : 'User';

    const comments = await Comment.find({
      'author.id': userId,
      authorModel,
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error("Error fetching user comments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user comments",
      error: error.message
    });
  }
};