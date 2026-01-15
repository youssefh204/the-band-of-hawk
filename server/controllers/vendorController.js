// controllers/vendorController.js
import Bazaar from '../models/bazaarModel.js';
import Application from '../models/application.js';
import Vendor from "../models/VendorModel.js";
import req from 'express/lib/request.js';

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({}, "companyName logo _id"); // Select only required fields

    res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching vendors" 
    });
  }
};

export const verifyVendor = async (req, res) => {
  try {
    res.json({
      success: true,
      vendor: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

export const getUpcomingBazaars = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const bazaars = await Bazaar.find({
      RegDeadline: { $gte: currentDate }
    }).sort({ startDate: 1 });

    res.json({
      success: true,
      data: bazaars
    });
  } catch (error) {
    console.error('Get bazaars error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bazaars'
    });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    // Import LoyaltyApplication at the top of the file
    const LoyaltyApplication = (await import('../models/LoyaltyApplication.js')).default;
    
    const [regularApps, loyaltyApps] = await Promise.all([
      Application.find({
        vendorId: req.user.id
      }).populate('bazaarId'),
      LoyaltyApplication.find({
        vendorId: req.user.id
      })
    ]);

    // Combine both types of applications
    const allApplications = [...regularApps, ...loyaltyApps];

    res.json({
      success: true,
      data: allApplications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

export const applyToBazaar = async (req, res) => {
  try {
    console.log('applyToBazaar called', { body: req.body, user: req.user });
    const { bazaarId, boothSize, attendees } = req.body;

    // Validate bazaar exists and registration is still open
    const bazaar = await Bazaar.findById(bazaarId);
    console.log('bazaar lookup result', { bazaarId, found: !!bazaar, RegDeadline: bazaar?.RegDeadline });
    if (!bazaar) {
      console.warn('applyToBazaar failing: bazaar not found', { bazaarId, body: req.body, user: req.user });
      return res.status(404).json({
        success: false,
        message: 'Bazaar not found'
      });
    }

    if (new Date() > new Date(bazaar.RegDeadline)) {
      console.warn('applyToBazaar failing: registration closed', { bazaarId, RegDeadline: bazaar.RegDeadline, now: new Date(), body: req.body, user: req.user });
      return res.status(400).json({
        success: false,
        message: 'Registration for this bazaar has closed'
      });
    }

    // Check if vendor already applied
    const existingApplication = await Application.findOne({
      bazaarId,
      vendorId: req.user.id
    });

    if (existingApplication) {
      console.warn('applyToBazaar failing: duplicate application', { bazaarId, vendorId: req.user.id, body: req.body, user: req.user });
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this bazaar'
      });
    }

    const normalizedAttendees = Array.isArray(attendees)
      ? attendees.map(a => ({ name: a.name || '', email: a.email || '' }))
      : [];

    const application = new Application({
      bazaarId,
      vendorId: req.user.id,
      vendorType: 'Vendor',
      boothSize,
      attendees: normalizedAttendees,
      type: 'bazaar',
      status: 'pending'
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Apply to bazaar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
};
export const cancelApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Must belong to vendor
    if (application.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Cannot cancel if paid
    if (application.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "You cannot cancel after payment has been made."
      });
    }

    // Update status to rejected or cancelled
    application.status = "rejected";  // fits your existing enum
    application.adminNotes = "Vendor cancelled their participation.";
    application.paymentStatus = "pending";
    application.cancelledAt = new Date();

    await application.save();

    res.json({
      success: true,
      message: "Application cancelled successfully.",
      data: application
    });

  } catch (error) {
    console.error("Cancel application error:", error);
    res.status(500).json({ success: false, message: "Server error cancelling application" });
  }
};

export const applyForBooth = async (req, res) => {
  try {
    const { duration, location, boothSize, attendees } = req.body;

    const normalizedAttendees = Array.isArray(attendees)
      ? attendees.map(a => ({ name: a.name || '', email: a.email || '' }))
      : [];

    const application = new Application({
      vendorId: req.user.id,
      vendorType: 'Vendor',
      duration: parseInt(duration),
      location,
      boothSize,
      attendees: normalizedAttendees,
      type: 'booth',
      status: 'pending'
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Booth application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Apply for booth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit booth application'
    });
  }
};