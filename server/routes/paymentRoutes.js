// routes/paymentRoutes.js
import express from 'express';
import {
  createPaymentIntent,
  confirmStripePayment,
  cancelRegistration,
  getWalletBalance,
  addToWallet,
  createWalletTopUpIntent,
  confirmWalletTopUp,
  createVendorApplicationPayment,
  confirmVendorApplicationPayment
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

console.log('🔄 Payment routes initializing...');

// Apply auth middleware to all payment routes
router.use(authMiddleware);

console.log('✅ Auth middleware applied to payment routes');

// Define routes
router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-payment', confirmStripePayment);
router.post('/cancel-registration', cancelRegistration);
router.get('/wallet', getWalletBalance);
router.post('/wallet/top-up', addToWallet);

// 🆕 NEW: Stripe wallet top-up routes
router.post('/wallet/top-up/stripe', createWalletTopUpIntent);
router.post('/wallet/top-up/confirm', confirmWalletTopUp);

// 🆕 Vendor Application Payments
router.post('/vendor-application', createVendorApplicationPayment);
router.post('/vendor-application/confirm', confirmVendorApplicationPayment);

console.log('✅ Payment routes defined:', [
  'POST /create-payment-intent',
  'POST /confirm-payment',
  'POST /cancel-registration',
  'GET /wallet',
  'POST /wallet/top-up',
  'POST /wallet/top-up/stripe',
  'POST /wallet/top-up/confirm',
  'POST /vendor-application',
  'POST /vendor-application/confirm'
]);

export default router;