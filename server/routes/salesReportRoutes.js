import express from 'express';
import { getSalesReport, exportSalesReport } from '../controllers/salesReportController.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// GET sales report with filters
router.get('/', authMiddleware, getSalesReport);

// Export sales report as CSV
router.get('/export', authMiddleware, exportSalesReport);

export default router;
