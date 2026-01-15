// controllers/registrationController.js
import User from '../models/userModel.js';
import Workshop from '../models/Workshop.js';
import Trip from '../models/TripModel.js';

// Register for workshop
export const registerForWorkshop = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const userId = req.user.id;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' });
    }

    // Check capacity
    if (workshop.currentRegistrations >= workshop.capacity) {
      return res.status(400).json({ success: false, message: 'Workshop is full' });
    }

    // Check if already registered
    const alreadyRegistered = workshop.registeredUsers.some(
      reg => reg.userId.toString() === userId
    );
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: 'Already registered for this workshop' });
    }

    // Add to workshop registrations
    workshop.registeredUsers.push({ userId });
    workshop.currentRegistrations += 1;
    await workshop.save();

    // Add to user's registered events and attendedEvents (so UI remembers join)
    await User.findByIdAndUpdate(userId, {
      $addToSet: { 'attendedEvents.workshops': workshopId },
      $push: {
        'eventRegistrations.workshops': {
          workshopId: workshopId,
          registeredAt: new Date(),
          status: 'registered'
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully registered for workshop',
      currentRegistrations: workshop.currentRegistrations
    });

  } catch (error) {
    console.error('Workshop registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// Register for trip
export const registerForTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check capacity
    if (trip.currentRegistrations >= trip.capacity) {
      return res.status(400).json({ success: false, message: 'Trip is full' });
    }

    // Check if already registered
    const alreadyRegistered = trip.Travelers.some(
      reg => reg.userId.toString() === userId
    );
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: 'Already registered for this trip' });
    }

    // Add to trip registrations (use Travelers array)
    trip.Travelers.push({ userId, userName: '', email: '' });
    trip.currentRegistrations += 1;
    trip.totalRegistrations = (trip.totalRegistrations || 0) + 1;
    await trip.save();

    // Add to user's registered events and attendedEvents
    await User.findByIdAndUpdate(userId, {
      $addToSet: { 'attendedEvents.trips': tripId },
      $push: {
        'eventRegistrations.trips': {
          tripId: tripId,
          registeredAt: new Date(),
          status: 'registered'
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully registered for trip',
      currentRegistrations: trip.currentRegistrations
    });

  } catch (error) {
    console.error('Trip registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// Cancel workshop registration
export const cancelWorkshopRegistration = async (req, res) => {
  try {
    const { workshopId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' });
    }

    // Check cancellation eligibility
    const canCancelResult = user.canCancelRegistration('workshop', workshopId, workshop.startDateTime);
    if (!canCancelResult.canCancel) {
      return res.status(400).json({ success: false, message: canCancelResult.reason });
    }

    const registration = canCancelResult.registration;
    const refundAmount = registration.amountPaid;

    // Process refund to wallet
    if (refundAmount > 0) {
      await user.addRefund(refundAmount, `Refund for workshop: ${workshop.workshopName}`, registration.paymentId, 'workshop', workshopId);
    }

    // Update registration status in user model
    registration.status = 'cancelled';
    await user.save();

    // Update workshop model
    await workshop.cancelUserRegistration(userId);

    res.status(200).json({
      success: true,
      message: 'Successfully cancelled workshop registration. Amount has been refunded to your wallet.'
    });

  } catch (error) {
    console.error('Workshop cancellation error:', error);
    res.status(500).json({ success: false, message: 'Cancellation failed', error: error.message });
  }
};

// Cancel trip registration
export const cancelTripRegistration = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check cancellation eligibility
    const canCancelResult = user.canCancelRegistration('trip', tripId, trip.startDateTime);
    if (!canCancelResult.canCancel) {
      return res.status(400).json({ success: false, message: canCancelResult.reason });
    }

    const registration = canCancelResult.registration;
    const refundAmount = registration.amountPaid;

    // Process refund to wallet
    if (refundAmount > 0) {
      await user.addRefund(refundAmount, `Refund for trip: ${trip.tripName}`, registration.paymentId, 'trip', tripId);
    }

    // Update registration status in user model
    registration.status = 'cancelled';
    await user.save();

    // Update trip model
    await trip.cancelUserRegistration(userId);

    res.status(200).json({
      success: true,
      message: 'Successfully cancelled trip registration. Amount has been refunded to your wallet.'
    });

  } catch (error) {
    console.error('Trip cancellation error:', error);
    res.status(500).json({ success: false, message: 'Cancellation failed', error: error.message });
  }
};

// Get user's registered events
export const getUserRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate('eventRegistrations.workshops.workshopId', 'workshopName startDateTime endDateTime location')
      .populate('eventRegistrations.trips.tripId', 'tripName startDateTime Destination')
      .populate('attendedEvents.workshops')
      .populate('attendedEvents.trips');

    res.status(200).json({
      success: true,
      eventRegistrations: user.eventRegistrations,
      attendedEvents: user.attendedEvents
    });

  } catch (error) {
    console.error('Get user registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get registrations', error: error.message });
  }
};