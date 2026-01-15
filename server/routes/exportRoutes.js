import express from 'express';
import { exportEventAttendees } from '../controllers/exportController.js';

const router = express.Router();

router.get('/:eventType/:eventId',
  exportEventAttendees
);

export default router;
