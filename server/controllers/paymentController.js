// controllers/paymentController.js
import stripe from '../config/stripe.js';
import Payment from '../models/Payment.js';
import User from '../models/userModel.js';
import Workshop from '../models/Workshop.js';
import Trip from '../models/TripModel.js';
import { sendPaymentReceipt } from '../config/emailTemplates.js';



// Create payment intent for vendor application (bazaar/booth)
export const createVendorApplicationPayment = async (req, res) => {
  try {
    const { applicationId, paymentMethod } = req.body;
    const vendorId = req.user.id;
    const Application = (await import('../models/application.js')).default;
    const Vendor = (await import('../models/VendorModel.js')).default;
    const application = await Application.findById(applicationId).populate('bazaarId');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (application.vendorId.toString() !== vendorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (application.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Application already paid' });
    }
    if (application.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Application must be approved before payment' });
    }
    // For Stripe payments, create payment intent
    const amount = application.price;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        vendorId: vendorId.toString(),
        applicationId: applicationId.toString(),
        type: application.type
      }
    });
    const payment = new Payment({
      userId: vendorId,
      eventType: application.type,
      eventId: applicationId,
      amount,
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending'
    });
    await payment.save();
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Create vendor application payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Confirm vendor application payment
export const confirmVendorApplicationPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
    if (paymentIntent.status === 'succeeded') {
      payment.status = 'completed';
      await payment.save();
      const Application = (await import('../models/application.js')).default;
      const application = await Application.findById(payment.eventId);
      
      if (application) {
        application.paymentStatus = 'paid';
        await application.save();
        
        // Generate and send QR codes (implement as needed)
        // await processApplicationPayment(application, vendor);
      }
      res.json({ success: true, message: 'Payment confirmed', data: { payment } });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed', status: paymentIntent.status });
    }
  } catch (error) {
    console.error('Confirm vendor application payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const createPaymentIntent = async (req, res) => {
  try {
    const { eventType, eventId, paymentMethod } = req.body;
    console.log('Debug - req.user in createPaymentIntent:', req.user);
    const userId = req.user.id;

    // Get user with wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get event details
    let event;
    if (eventType === 'workshop') {
      event = await Workshop.findById(eventId);
    } else if (eventType === 'trip') {
      event = await Trip.findById(eventId);
    }

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if event is free
    const eventPrice = Number(event.price) || 0;
    if (eventPrice === 0) {
      return res.status(400).json({ success: false, message: 'This event is free' });
    }

    // Check if already registered and paid
    const existingPayment = await Payment.findOne({
      userId,
      eventType,
      eventId,
      status: 'completed'
    });

    if (existingPayment) {
      return res.status(400).json({ success: false, message: 'Already registered and paid for this event' });
    }

    if (paymentMethod === 'wallet') {
      // Handle wallet payment
      if (user.walletBalance < eventPrice) {
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient wallet balance' 
        });
      }

      // Create payment record
      const payment = new Payment({
        userId,
        eventType,
        eventId,
        amount: eventPrice,
        paymentMethod: 'wallet',
        status: 'completed'
      });

      await payment.save();

      // Deduct from wallet using the model method
      await user.deductFromWallet(
        eventPrice,
        `Payment for ${eventType}: ${event.workshopName || event.tripName}`,
        payment._id,
        eventType,
        eventId
      );

      // Register user for event
      await registerUserForEvent(userId, eventType, eventId, payment._id, eventPrice);

      // Send receipt
      await sendPaymentReceipt(user.email, user.firstName, payment, event);

      return res.json({
        success: true,
        message: 'Payment completed successfully',
        data: { payment }
      });
    } else {
      // Stripe payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(eventPrice * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          userId: userId.toString(),
          eventType,
          eventId: eventId.toString()
        }
      });

      // Create pending payment record
      const payment = new Payment({
        userId,
        eventType,
        eventId,
        amount: eventPrice,
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending'
      });
      await payment.save();

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id
      });
    }
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmStripePayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    console.log('TRACE: confirmStripePayment - Received paymentId:', paymentId);
    
    const payment = await Payment.findById(paymentId).populate('userId');
    if (!payment) {
      console.log('TRACE: confirmStripePayment - Payment not found for paymentId:', paymentId);
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    console.log('TRACE: confirmStripePayment - Found payment:', payment._id);
    console.log('TRACE: confirmStripePayment - payment.stripePaymentIntentId:', payment.stripePaymentIntentId);

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
    console.log('TRACE: confirmStripePayment - Stripe paymentIntent retrieved. Status:', paymentIntent.status);
    
    if (paymentIntent.status === 'succeeded') {
      payment.status = 'completed';
      console.log('TRACE: confirmStripePayment - PaymentIntent status is succeeded. Updating payment status to completed.');
      
      // Get receipt URL from Stripe
      const charges = await stripe.charges.list({
        payment_intent: paymentIntent.id
      });
      console.log('TRACE: confirmStripePayment - Stripe charges retrieved. Count:', charges.data.length);
      
      if (charges.data.length > 0) {
        payment.receiptUrl = charges.data[0].receipt_url;
        console.log('TRACE: confirmStripePayment - Receipt URL:', payment.receiptUrl);
      }
      
      await payment.save();
      console.log('TRACE: confirmStripePayment - Payment saved as completed.');

      // Register user for event
      console.log('TRACE: confirmStripePayment - Registering user for event. UserID:', payment.userId._id, 'EventType:', payment.eventType, 'EventID:', payment.eventId);
      await registerUserForEvent(payment.userId._id, payment.eventType, payment.eventId, payment._id, payment.amount);
      console.log('TRACE: confirmStripePayment - User registered for event.');

      // Send receipt email
      let event;
      if (payment.eventType === 'workshop') {
        event = await Workshop.findById(payment.eventId);
        console.log('TRACE: confirmStripePayment - Fetched workshop event:', event?._id);
      } else if (payment.eventType === 'trip') {
        event = await Trip.findById(payment.eventId);
        console.log('TRACE: confirmStripePayment - Fetched trip event:', event?._id);
      } else {
        console.log('TRACE: confirmStripePayment - Unknown eventType:', payment.eventType);
      }

      if (event && payment.userId.email) {
        console.log('TRACE: confirmStripePayment - Sending payment receipt to:', payment.userId.email);
        await sendPaymentReceipt(payment.userId.email, payment.userId.firstName, payment, event);
        console.log('TRACE: confirmStripePayment - Payment receipt sent.');
      } else {
        console.log('TRACE: confirmStripePayment - Skipping receipt email: event or user email not found.');
      }

      res.json({ success: true, message: 'Payment confirmed', data: { payment } });
      console.log('TRACE: confirmStripePayment - Response sent: Payment confirmed.');
    } else {
      console.log('TRACE: confirmStripePayment - Payment not succeeded. Status:', paymentIntent.status);
      res.status(400).json({ success: false, message: 'Payment not completed', status: paymentIntent.status });
      console.log('TRACE: confirmStripePayment - Response sent: Payment not completed.');
    }
  } catch (error) {
    console.error('ERROR: confirmStripePayment - Confirm payment error:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
    console.log('TRACE: confirmStripePayment - Response sent: 500 Internal Server Error.');
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const { eventType, eventId } = req.body;
    const userId = req.user.id;
    const now = new Date(); // Define 'now' here

    console.log('🔍 Cancelling registration:', { userId, eventType, eventId });

    // Find the payment for this registration
    const payment = await Payment.findOne({
      userId,
      eventType,
      eventId,
      status: 'completed'
    });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'No payment found for this registration' 
      });
    }

    // Get event details for cancellation policy
    let event;
    if (eventType === 'workshop') {
      event = await Workshop.findById(eventId);
    } else {
      event = await Trip.findById(eventId);
    }

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if event has already ended
    const eventEndDateTime = new Date(event.endDateTime);
    if (now > eventEndDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a past event.'
      });
    }

    // Check cancellation policy (2 weeks before event END date)
    const cancellationCutoff = new Date(eventEndDateTime.getTime() - (14 * 24 * 60 * 60 * 1000));

    if (now > cancellationCutoff) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cancellation not allowed. Must cancel at least 2 weeks before the event ends.' 
      });
    }

    // Get user and process refund
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('💰 Processing refund:', {
      userId,
      eventType,
      eventId,
      amount: payment.amount,
      currentBalance: user.walletBalance
    });

    // Add refund to wallet
    await user.addRefund(
      payment.amount,
      `Refund for cancelled ${eventType}: ${event.workshopName || event.tripName}`,
      payment._id,
      eventType,
      eventId
    );

    // Update payment status
    payment.refundAmount = payment.amount;
    payment.status = 'refunded';
    payment.cancelledAt = new Date();
    payment.cancellationReason = 'User requested cancellation';
    await payment.save();

    // Remove user from event registrations
    await removeUserFromEvent(userId, eventType, eventId);

    // Refresh user data to get updated balance
    const updatedUser = await User.findById(userId);

    console.log('✅ Refund processed successfully:', {
      newBalance: updatedUser.walletBalance,
      refundAmount: payment.amount
    });

    res.json({
      success: true,
      message: 'Registration cancelled and refund processed',
      data: { 
        payment,
        newBalance: updatedUser.walletBalance,
        refundAmount: payment.amount
      }
    });
  } catch (error) {
    console.error('❌ Cancel registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: 'Failed to process cancellation'
    });
  }
};

export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('walletBalance transactionHistory firstName lastName email');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Calculate total refunds
    const totalRefunds = user.transactionHistory
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({ 
      success: true, 
      data: {
        walletBalance: user.walletBalance,
        transactionHistory: user.transactionHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        totalRefunds: totalRefunds,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const user = await User.findById(userId);
    await user.addToWallet(amount, 'Wallet top-up');

    res.json({
      success: true,
      message: 'Wallet topped up successfully',
      data: { 
        newBalance: user.walletBalance,
        transaction: user.transactionHistory[user.transactionHistory.length - 1]
      }
    });
  } catch (error) {
    console.error('Add to wallet error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🆕 NEW: Stripe Wallet Top-up
export const createWalletTopUpIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Create Stripe payment intent for wallet top-up
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: userId.toString(),
        type: 'wallet_topup',
        amount: amount.toString()
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create wallet top-up intent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🆕 NEW: Confirm Wallet Top-up
export const confirmWalletTopUp = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    console.log('🔍 Confirming wallet top-up:', { paymentIntentId, userId });

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const amount = parseFloat(paymentIntent.metadata.amount);
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      console.log('✅ Payment succeeded, adding to wallet:', amount);

      // Add to wallet
      await user.addToWallet(amount, 'Wallet top-up via Stripe');

      // 🆕 FIXED: Create payment record for tracking (with proper wallet_topup type)
      const payment = new Payment({
        userId,
        amount: amount,
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntentId,
        status: 'completed',
        eventType: 'wallet_topup', // This is now allowed in the enum
        // Note: eventId is not required for wallet_topup due to our schema fix
        topUpDescription: 'Wallet top-up via Stripe'
      });
      
      await payment.save();

      console.log('✅ Wallet top-up completed:', {
        userId,
        amount,
        newBalance: user.walletBalance,
        paymentId: payment._id
      });

      res.json({
        success: true,
        message: 'Wallet topped up successfully',
        data: { 
          newBalance: user.walletBalance,
          amountAdded: amount,
          paymentId: payment._id
        }
      });
    } else {
      console.log('❌ Payment not completed:', paymentIntent.status);
      res.status(400).json({ 
        success: false, 
        message: `Payment not completed. Status: ${paymentIntent.status}` 
      });
    }
  } catch (error) {
    console.error('❌ Confirm wallet top-up error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: 'Payment validation failed. Please try again.'
    });
  }
};

// Helper functions
async function registerUserForEvent(userId, eventType, eventId, paymentId, amountPaid) {
  const user = await User.findById(userId);
  
  if (eventType === 'workshop') {
    await user.registerForWorkshop(eventId, paymentId, amountPaid);
    // Also update workshop registration count
    await Workshop.findByIdAndUpdate(eventId, {
      $inc: { currentRegistrations: 1 }
    });
  } else if (eventType === 'trip') {
    await user.registerForTrip(eventId, paymentId, amountPaid);
    // Also update trip registration count
    await Trip.findByIdAndUpdate(eventId, {
      $inc: { currentRegistrations: 1 }
    });
  }
}

async function removeUserFromEvent(userId, eventType, eventId) {
  const user = await User.findById(userId);
  
  if (eventType === 'workshop') {
    await user.cancelWorkshopRegistration(eventId);
    await Workshop.findByIdAndUpdate(eventId, {
      $inc: { currentRegistrations: -1 }
    });
  } else if (eventType === 'trip') {
    await user.cancelTripRegistration(eventId);
    await Trip.findByIdAndUpdate(eventId, {
      $inc: { currentRegistrations: -1 }
    });
  }
}