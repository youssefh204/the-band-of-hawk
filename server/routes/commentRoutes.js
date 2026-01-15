import express from "express";
import { 
  createComment, 
  getEventComments, 
  getAllComments, 
  deleteComment, 
  getUserComments
} from "../controllers/commentController.js";
import { commentAuthMiddleware, commentAuthorizeRoles } from "../middleware/commentAuth.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/event/:eventType/:eventId", getEventComments);

// All routes below require authentication
router.use(commentAuthMiddleware);

// Create comment (only for registered users)
router.post("/", createComment);

// Get user's own comments
router.get("/my-comments", getUserComments);

// Get all comments (admin/staff only - for moderation)
router.get("/all", commentAuthorizeRoles('admin', 'staff'), getAllComments);

// Delete comment (admin only)
router.delete("/:id", commentAuthorizeRoles('admin'), deleteComment);

export default router;