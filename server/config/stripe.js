// server/config/stripe.js
import Stripe from 'stripe';

let stripe;

// Check if we have a valid Stripe secret key
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    console.log('✅ Stripe initialized with real API key');
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error.message);
    stripe = createMockStripe();
  }
} else {
  stripe = createMockStripe();
}

function createMockStripe() {
  console.log('⚠️ Using mock Stripe for development');
  console.log('💡 Add real Stripe keys to .env for payment processing');
  
  return {
    paymentIntents: {
      create: async (data) => {
        console.log('🔄 Mock Stripe: Creating payment intent for $' + (data.amount / 100));
        return {
          id: 'pi_mock_' + Date.now(),
          client_secret: 'mock_client_secret_' + Date.now(),
          status: 'requires_payment_method'
        };
      },
      retrieve: async (id) => {
        console.log('🔄 Mock Stripe: Retrieving payment intent', id);
        return {
          status: 'succeeded',
          id: id
        };
      }
    },
    refunds: {
      create: async (data) => {
        console.log('🔄 Mock Stripe: Creating refund for $' + (data.amount / 100));
        return {
          id: 're_mock_' + Date.now(),
          status: 'succeeded'
        };
      }
    },
    charges: {
      list: async (data) => {
        console.log('🔄 Mock Stripe: Listing charges');
        return {
          data: [{
            receipt_url: 'https://example.com/receipt'
          }]
        };
      }
    }
  };
}

export default stripe;