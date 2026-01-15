import stripe from '../config/stripe.js';
import Payment from '../models/Payment.js';
import User from '../models/userModel.js';
import { sendPaymentReceipt } from '../config/emailTemplates.js';

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received event: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

async function handlePaymentSuccess(paymentIntent) {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    }).populate('userId');
    
    if (!payment) {
      console.error('Payment not found for intent:', paymentIntent.id);
      return;
    }

    // Update payment status
    payment.status = 'completed';
    payment.stripeChargeId = paymentIntent.latest_charge;
    
    // Get receipt URL
    const charges = await stripe.charges.list({
      payment_intent: paymentIntent.id
    });
    
    if (charges.data.length > 0) {
      payment.receiptUrl = charges.data[0].receipt_url;
    }
    
    await payment.save();

    // Register user for event
    await registerUserForEvent(payment.userId, payment.eventType, payment.eventId);

    // Send receipt email
    let event;
    if (payment.eventType === 'workshop') {
      const Workshop = await import('../models/Workshop.js');
      event = await Workshop.default.findById(payment.eventId);
    } else {
      const Trip = await import('../models/TripModel.js');
      event = await Trip.default.findById(payment.eventId);
    }

    if (event && payment.userId.email) {
      await sendPaymentReceipt(
        payment.userId.email, 
        payment.userId.firstName, 
        payment, 
        event
      );
    }

    console.log(`Payment ${payment._id} completed successfully`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });
    
    if (payment) {
      payment.status = 'failed';
      await payment.save();
      console.log(`Payment ${payment._id} failed`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function registerUserForEvent(userId, eventType, eventId) {
  const user = await User.findById(userId);
  
  if (eventType === 'workshop') {
    const Workshop = await import('../models/Workshop.js');
    
    // Add to user's registrations
    await user.registerForWorkshop(eventId, null, 0, "registered");
    
    // Update workshop registration count
    await Workshop.default.findByIdAndUpdate(eventId, {
      $inc: { currentRegistrations: 1 }
    });
  } else if (eventType === 'trip') {
    const Trip = await import('../models/TripModel.js');
    
    // Add to user's registrations
    await user.registerForTrip(eventId, null, 0);
    
    // Update trip registration count
    await Trip.default.findByIdAndUpdate(eventId, {
      $inc: { currentRegistrations: 1 }
    });
  }
}