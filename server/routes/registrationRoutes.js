// routes/registrationRoutes.js
import express from 'express';
import {
  registerForWorkshop,
  registerForTrip,
  cancelWorkshopRegistration,
  cancelTripRegistration,
  getUserRegistrations
} from '../controllers/registrationController.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Workshop registration
router.post('/workshops/:workshopId/register', registerForWorkshop);
router.delete('/workshops/:workshopId/cancel', cancelWorkshopRegistration);

// Trip registration
router.post('/trips/:tripId/register', registerForTrip);
router.delete('/trips/:tripId/cancel', cancelTripRegistration);

// Get user's registrations
router.get('/my-registrations', getUserRegistrations);

export default router;