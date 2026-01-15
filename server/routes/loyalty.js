import express from 'express';
import LoyaltyApplication from '../models/LoyaltyApplication.js';
import authMiddleware from '../middleware/AuthMiddleware.js';
import Notification from '../models/NotificationModel.js'; // 👈 ADD THIS

const router = express.Router();

// Get all approved loyalty program vendors (public/student/staff access)
router.get('/vendors', async (req, res) => {
  try {
    // Get vendors that are either approved or pending (not rejected)
    const vendors = await LoyaltyApplication.find({ 
      status: { $in: ['approved', 'pending'] } 
    })
      .populate('vendorId', 'companyName businessType location')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: vendors,
      count: vendors.length 
    });
  } catch (err) {
    console.error('Error fetching loyalty vendors:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch loyalty vendors' });
  }
});

router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { discountRate, promoCode, termsAndConditions } = req.body;

    // Validate required fields
    if (!discountRate || !promoCode || !termsAndConditions) {
      return res.status(400).json({ message: 'Missing required fields: discountRate, promoCode, termsAndConditions' });
    }

    // Check if vendor already has a loyalty application with this promo code
    const existingApp = await LoyaltyApplication.findOne({
      vendorId: req.user.id,
      promoCode: promoCode.toUpperCase()
    });

    if (existingApp) {
      return res.status(409).json({ message: 'You already have a loyalty application with this promo code' });
    }

    // Create a new loyalty application
    const newApp = new LoyaltyApplication({
      vendorId: req.user.id,
      discountRate: Number(discountRate),
      promoCode: promoCode.toUpperCase(),
      termsAndConditions,
      type: 'loyalty'
    });

    await newApp.save();
    const newNotification = await Notification.create({
      message: `🎉 New GUC Loyalty Partner: ${req.user.companyName || "A Vendor"} has joined! Check the Loyalty tab for ${discountRate}% OFF.`,
      type: "success",
      userRoles: ["student", "staff", "ta", "professor"], // Target Audience
      link: "/loyalty" 
    });
    if (req.io) {
        req.io.emit("new-notification", newNotification);
    } else if (global.io) {
        global.io.emit("new-notification", newNotification);
    }
    
    res.status(201).json({ message: 'Loyalty application submitted!', data: newApp });
  } catch (err) {
    console.error('Error submitting loyalty application:', err);
    
    // Handle duplicate promo code error
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This promo code is already in use. Please choose a different one.' });
    }
    
    res.status(500).json({ message: 'Failed to submit loyalty application: ' + err.message });
  }
});

// Cancel loyalty application (vendor)
router.delete('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const app = await LoyaltyApplication.findById(id);
    if (!app) return res.status(404).json({ message: 'Loyalty application not found' });

    if (app.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Delete the loyalty application completely since vendor cancelled
    await LoyaltyApplication.findByIdAndDelete(id);

    res.json({ message: 'Loyalty application deleted' });
  } catch (err) {
    console.error('Error cancelling loyalty application:', err);
    res.status(500).json({ message: 'Failed to cancel loyalty application' });
  }
});

export default router;
