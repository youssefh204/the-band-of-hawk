// routes/vendorRoutes.js
import express from 'express';
import { 
  getAllVendors,
  getUpcomingBazaars,
  getMyApplications,
  applyToBazaar,
  applyForBooth,
  verifyVendor,
  cancelApplication
} from '../controllers/vendorController.js';
import { getAllUploads } from "../controllers/adminUploadsController.js";

import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();
router.get("/all", getAllVendors);

// Apply auth middleware to all vendor routes
router.use(authMiddleware);
router.get('/', getAllVendors);
// server/routes/vendorRoutes.js
router.get('/verify', verifyVendor);
router.get('/bazaars/upcoming', getUpcomingBazaars);
router.get('/applications/my', getMyApplications);
router.post('/applications/bazaar', applyToBazaar);


router.get("/admin/all-uploads", authMiddleware, getAllUploads);

router.post('/applications/booth', applyForBooth);
router.delete('/applications/:id/cancel', cancelApplication);


export default router;