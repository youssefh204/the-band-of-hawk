import express from "express";
import { 
  getAllUsers, 
  getUserById,
  updateUser, 
  deleteUser, 
  addWorkshopToUser,
  addTripToUser, 
  removeWorkshopFromUser,
  removeTripFromUser,
  blockUser,
  unblockUser,
  getBlockedUsers
} from "../controllers/UserController.js";

import { authMiddleware, authorizeRoles } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// Protected routes
router.get("/", authMiddleware, authorizeRoles('Admin', 'EventOffice'), getAllUsers);
router.get('/:id', authMiddleware, getUserById);

router.put("/:id", authMiddleware, authorizeRoles('Admin'), updateUser);

router.delete("/:id", authMiddleware, authorizeRoles('Admin'), deleteUser);

router.put('/:userId/workshops/:workshopId', authMiddleware, addWorkshopToUser);
router.put('/:userId/trips/:tripId', authMiddleware, addTripToUser);

router.delete('/:userId/workshops/:workshopId', authMiddleware, removeWorkshopFromUser);
router.delete('/:userId/trips/:tripId', authMiddleware, removeTripFromUser);

// Block/Unblock
router.put("/:id/block", authMiddleware, authorizeRoles('Admin'), blockUser);
router.put("/:id/unblock", authMiddleware, authorizeRoles('Admin'), unblockUser);
router.get("/blocked/list", authMiddleware, authorizeRoles('Admin'), getBlockedUsers);

export default router;
