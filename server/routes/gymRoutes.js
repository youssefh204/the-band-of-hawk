import express from 'express';
const router = express.Router();
import {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  joinSession,
  cancelSession,
  getAvailableSessions
} from '../controllers/gymController.js';
import authMiddleware from '../middleware/AuthMiddleware.js';

// CRUD routes
router.post('/', createSession);
router.get('/', getAllSessions);
router.get('/available', getAvailableSessions);
router.get('/:id', getSessionById);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

// Special routes
router.post('/:id/join', authMiddleware,joinSession);
router.post('/:id/cancel',authMiddleware, cancelSession);

export default router;