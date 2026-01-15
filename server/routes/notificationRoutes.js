import express from 'express';
import { getNotifications, markAsRead, createNotification } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js'; 

const router = express.Router();

// 1. The Standard Route
router.get('/', authMiddleware, getNotifications);

// 2. The "Band-Aid" Route (Fixes your Frontend 404 error)
// It catches requests like "/api/notifications/role/EventOffice" and handles them correctly
router.get('/role/:role', authMiddleware, getNotifications); 
router.post('/', authMiddleware, createNotification);


// 3. Mark Read Route
router.put('/:id/read', authMiddleware, markAsRead);

export default router;