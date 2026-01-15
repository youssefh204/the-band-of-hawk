// In src/controllers/applicationController.js

import req from 'express/lib/request.js';
import Application from '../models/application.js';
import Bazaar from '../models/bazaarModel.js';
import Notification from '../models/NotificationModel.js';
import User from '../models/userModel.js'
import Vendor from '../models/VendorModel.js';
import { sendApplicationStatusEmail } from '../config/emailTemplates.js';

// Helper: calculate application price
const calculatePrice = (type, boothSize, duration = null, location = null) => {
  const basePrice = {
    '2x2': 100,
    '4x4': 200
  };

  const locationMultiplier = {
    'GUC Cairo': 1.0,
    'GUC Berlin': 1.5
  };

  let price = basePrice[boothSize] || 100;

  if (type === 'booth' && duration) {
    price *= duration; // Multiply by number of weeks
  }

  if (location && locationMultiplier[location]) {
    price *= locationMultiplier[location];
  }

  return price;
};

// Helper: normalize attendees array if client sends attendees as objects
const normalizeAttendees = (attendees) => {
  if (!Array.isArray(attendees)) return [];
  return attendees.map(a => ({ name: a.name || '', email: a.email || '', idDocumentUrl: a.idDocumentUrl || '' }));
};

// For a vendor to apply to a SPECIFIC BAZAAR
export const createApplication = async (req, res) => {
  try {
    console.log('createApplication called', { body: req.body, user: req.user });
    const { bazaarId, vendorId, attendees, boothSize } = req.body;

    // Prefer authenticated vendor id when available
    const authVendorId = req.user?.id || req.user?._id;
    const finalVendorId = authVendorId || vendorId;

    if (!finalVendorId) {
      console.warn('createApplication validation failed - missing vendorId', { body: req.body, user: req.user });
      return res.status(400).json({ success: false, message: 'vendorId is required' });
    }
    if (!bazaarId) {
      console.warn('createApplication validation failed - missing bazaarId', { body: req.body, user: req.user });
      return res.status(400).json({ success: false, message: 'bazaarId is required' });
    }
    if (!boothSize) {
      console.warn('createApplication validation failed - missing boothSize', { body: req.body, user: req.user });
      return res.status(400).json({ success: false, message: 'boothSize is required' });
    }

    // Get bazaar to determine location
    const bazaar = await Bazaar.findById(bazaarId);
    if (!bazaar) {
      return res.status(404).json({ success: false, message: 'Bazaar not found' });
    }

    const normalized = normalizeAttendees(attendees);

    // Calculate price for bazaar application
    const price = calculatePrice('bazaar', boothSize, null, bazaar.location);

    const newApplication = new Application({
      type: 'bazaar',
      bazaarId: bazaarId,
      vendorId: finalVendorId,
      vendorType: 'Vendor',
      attendees: normalized,
      boothSize,
      price
    });

    await newApplication.save();
// 🔍 Find Event Office + Admin users



  const notifications = admins.map(a => ({
    userId: a._id,
    message: `🛍️ Vendor "${finalVendorId}" has requested a booth`,
    type: 'info'
  }));
  await Notification.insertMany(notifications);




    res.status(201).json({ success: true, data: newApplication });
  } catch (error) {
    console.error('createApplication error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// For a vendor to submit a GENERAL BOOTH REQUEST
export const createGeneralRequest = async (req, res) => {
  try {
    console.log('createGeneralRequest called', { body: req.body, user: req.user });
    const { vendorId, attendees, boothSize, duration, location } = req.body;

    // Prefer authenticated vendor id when available
    const authVendorId = req.user?.id || req.user?._id;
    const finalVendorId = authVendorId || vendorId;

    if (!finalVendorId) {
      console.warn('createGeneralRequest validation failed - missing vendorId', { body: req.body, user: req.user });
      return res.status(400).json({ success: false, message: 'vendorId is required' });
    }
    if (!boothSize) {
      console.warn('createGeneralRequest validation failed - missing boothSize', { body: req.body, user: req.user });
      return res.status(400).json({ success: false, message: 'boothSize is required' });
    }
    if (!location) {
      console.warn('createGeneralRequest validation failed - missing location', { body: req.body, user: req.user });
      return res.status(400).json({ success: false, message: 'location is required' });
    }

    const normalized = normalizeAttendees(attendees);

    // Calculate price for booth application
    const price = calculatePrice('booth', boothSize, duration, location);

    const newRequest = new Application({
      type: 'booth',
      vendorId: finalVendorId,
      vendorType: 'Vendor',
      attendees: normalized,
      boothSize,
      duration: duration,
      location,
      price
    });

    await newRequest.save();
// 🔍 Find Event Office + Admin users
const admins = await User.find({
  role: { $in: ['EventsOffice', 'EventOffice', 'eventoffice', 'Admin', 'admin'] }
});


  const notifications = admins.map(a => ({
    userId: a._id,
    message: `🛍️ Vendor "${finalVendorId}" has requested a booth`,
    type: 'info'
  }));
  await Notification.insertMany(notifications);


    res.status(201).json({ success: true, data: newRequest });

  } catch (error) {
    console.error('createGeneralRequest error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// For a vendor to get all their own applications
export const getMyApplications = async (req, res) => {
  try {
    console.log('getMyApplications called', { query: req.query, user: req.user });
    // Prefer authenticated vendor id when available
    const authVendorId = req.user?.id || req.user?._id;
    const vendorId = authVendorId || req.query?.vendorId;

    if (!vendorId) {
      console.warn('getMyApplications validation failed - missing vendorId', { query: req.query, user: req.user });
      return res.status(400).json({ success: false, message: 'vendorId is required' });
    }

    // Populate bazaar details if present
    const applications = await Application.find({ vendorId: vendorId }).populate('bazaarId');
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error('getMyApplications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getAllApplications = async (req, res) => {
  try {
    console.log('getAllApplications called', { query: req.query, user: req.user });

    // This gets ALL applications without any filters
    const applications = await Application.find() // No filter condition = get all documents
      .populate('vendorId', 'companyName shopName email phone businessType')
      .populate('bazaarId', 'bazaarName startDate endDate location Description')
      .sort({ createdAt: -1 });

    console.log(`Found ${applications.length} applications`);

    res.status(200).json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('getAllApplications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const acceptApplication = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('acceptApplication called', { id });

    if (!id) {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    // Find application first to recalculate price if needed
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Calculate price if not already set
    let price = application.price;
    if (!price || price === 0) {
      let location = application.location;
      if (application.type === 'bazaar' && application.bazaarId) {
        const bazaar = await Bazaar.findById(application.bazaarId);
        if (bazaar) {
          location = bazaar.location;
        }
      }
      price = calculatePrice(application.type, application.boothSize, application.duration, location);
    }

    // Set acceptance date and payment deadline (3 days from now)
    const acceptanceDate = new Date();
    const paymentDeadline = new Date();
    paymentDeadline.setDate(paymentDeadline.getDate() + 3);

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        adminNotes: req.body.adminNotes || '',
        price,
        acceptanceDate,
        paymentDeadline
      },
      { new: true, runValidators: true }
    )
      .populate('vendorId', 'companyName shopName email phone')
      .populate('bazaarId', 'bazaarName startDate endDate location');

    if (!updatedApplication) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    console.log('Application accepted:', updatedApplication._id);

    // Send notification email to vendor
    try {
      if (updatedApplication.vendorId && updatedApplication.vendorId.email) {
        await sendApplicationStatusEmail(
          updatedApplication.vendorId.email,
          updatedApplication.vendorId.companyName || 'Vendor',
          updatedApplication,
          updatedApplication.bazaarId
        );
        console.log('Acceptance email sent to vendor');
      }
    } catch (emailError) {
      console.error('Failed to send acceptance email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      data: updatedApplication,
      message: 'Application approved successfully'
    });
  } catch (error) {
    console.error('acceptApplication error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body; // Optional rejection reason

    console.log('rejectApplication called', { id, rejectionReason });

    if (!id) {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        adminNotes: rejectionReason || req.body.adminNotes || 'Application rejected'
      },
      { new: true, runValidators: true }
    )
      .populate('vendorId', 'companyName shopName email phone')
      .populate('bazaarId', 'bazaarName startDate endDate location');

    if (!updatedApplication) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    console.log('Application rejected:', updatedApplication._id);

    // Send rejection email to vendor
    try {
      if (updatedApplication.vendorId && updatedApplication.vendorId.email) {
        await sendApplicationStatusEmail(
          updatedApplication.vendorId.email,
          updatedApplication.vendorId.companyName || 'Vendor',
          updatedApplication,
          updatedApplication.bazaarId
        );
        console.log('Rejection email sent to vendor');
      }
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      data: updatedApplication,
      message: 'Application rejected successfully'
    });
  } catch (error) {
    console.error('rejectApplication error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};
export const resetApplication = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('resetApplication called', { id });

    if (!id) {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      {
        status: 'pending',
        adminNotes: req.body.adminNotes || 'Application reset to pending'
      },
      { new: true, runValidators: true }
    )
      .populate('vendorId', 'companyName shopName email phone')
      .populate('bazaarId', 'bazaarName startDate endDate location');

    if (!updatedApplication) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    console.log('Application reset to pending:', updatedApplication._id);

    res.status(200).json({
      success: true,
      data: updatedApplication,
      message: 'Application reset to pending status successfully'
    });
  } catch (error) {
    console.error('resetApplication error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};