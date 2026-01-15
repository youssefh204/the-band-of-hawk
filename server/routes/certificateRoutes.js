// routes/certificateRoutes.js
import express from 'express';
import { sendWorkshopCertificates, requestCertificateAndSendEmail } from '../controllers/certificateController.js';
import { authMiddleware, requireAdmin } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Send workshop certificates (admin only)
router.post('/workshops/:workshopId/send', requireAdmin, sendWorkshopCertificates);

// Request and send individual workshop certificate via email (user initiated)
router.post('/request-workshop-certificate', requestCertificateAndSendEmail);

export default router;

