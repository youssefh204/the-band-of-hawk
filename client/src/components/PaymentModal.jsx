import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment, getWalletBalance } from '../apis/paymentClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ event: paymentEvent, eventType, onSuccess, onClose }) { // 🆕 Renamed prop to avoid conflict
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await getWalletBalance();
        if (res.data.success) {
          setWalletBalance(res.data.data.walletBalance);
        } else {
          console.error('Failed to fetch wallet balance:', res.data.message);
        }
      } catch (err) {
        console.error('Failed to fetch wallet balance:', err.response?.data?.message || err.message);
      }
    };
    fetchWallet();
  }, []);

  // 🆕 ADD DEBUGGING
  useEffect(() => {
    console.log('🔍 PaymentModal Debug:', {
      paymentEvent,
      eventType,
      hasStripe: !!stripe,
      hasElements: !!elements,
      walletBalance
    });
  }, [paymentEvent, eventType, stripe, elements, walletBalance]);

  const handleSubmit = async (submitEvent) => { // 🆕 Renamed parameter to avoid conflict
    submitEvent.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔄 Starting payment process:', {
      paymentMethod,
      eventType,
      eventId: paymentEvent?._id,
      eventPrice: paymentEvent?.price,
      walletBalance
    });

    try {
      if (paymentMethod === 'wallet') {
        console.log('💰 Processing wallet payment...');
        const res = await createPaymentIntent({
          eventType,
          eventId: paymentEvent._id, // 🆕 Use renamed prop
          paymentMethod: 'wallet'
        });
        
        console.log('✅ Wallet payment response:', res.data);
        
        if (res.data.success) {
          onSuccess(res.data.data.payment);
        } else {
          setError(res.data.message || 'Wallet payment failed');
        }
      } else {
        console.log('💳 Processing Stripe payment...');
        const res = await createPaymentIntent({
          eventType,
          eventId: paymentEvent._id, // 🆕 Use renamed prop
          paymentMethod: 'stripe'
        });

        console.log('✅ Stripe payment intent response:', res.data);

        if (!res.data.success) {
          setError(res.data.message || 'Failed to create payment intent');
          return;
        }

        if (!stripe || !elements) {
          setError('Stripe not loaded');
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setError('Card element not found');
          return;
        }

        console.log('🔐 Confirming card payment...');
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          res.data.clientSecret,
          {
            payment_method: {
              card: cardElement,
            }
          }
        );

        if (stripeError) {
          console.error('❌ Stripe payment error:', stripeError);
          setError(stripeError.message);
        } else if (paymentIntent.status === 'succeeded') {
          console.log('✅ Stripe payment succeeded, confirming on backend...');
          // Confirm payment on the backend
          await confirmPayment({ paymentId: res.data.paymentId });
          onSuccess({ 
            id: res.data.paymentId,
            status: 'completed'
          });
        } else {
          console.warn('⚠️ Payment intent status:', paymentIntent.status);
          setError(`Payment status: ${paymentIntent.status}`);
        }
      }
    } catch (err) {
      console.error('❌ Payment process error:', err);
      setError(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 ADD VALIDATION
  if (!paymentEvent) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/20">
          <div className="text-red-400 text-center">Error: No event selected</div>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4">Complete Payment</h2>
        
        <div className="mb-4">
          <h3 className="text-white font-semibold">{paymentEvent.workshopName || paymentEvent.tripName}</h3>
          <p className="text-white/70">Amount: ${paymentEvent.price}</p>
          <p className="text-white/50 text-sm">Event Type: {eventType}</p>
        </div>

        <div className="mb-4">
          <label className="text-white block mb-2">Payment Method</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              <span className="text-white">Credit/Debit Card</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              <span className="text-white">Wallet (${walletBalance})</span>
            </label>
          </div>
        </div>

        {paymentMethod === 'stripe' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-white/10 rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#fff',
                      '::placeholder': {
                        color: '#a1a1aa',
                      },
                    },
                  },
                }}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!stripe || loading}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition"
              >
                {loading ? 'Processing...' : `Pay $${paymentEvent.price}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {paymentMethod === 'wallet' && (
          <div className="space-y-4">
            {walletBalance < paymentEvent.price ? (
              <div className="text-red-400 p-2 bg-red-400/10 rounded">
                Insufficient wallet balance. Please top up or use another payment method.
              </div>
            ) : (
              <>
                <div className="text-green-400 p-2 bg-green-400/10 rounded">
                  Wallet balance: ${walletBalance}
                </div>
                {error && (
                  <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition"
                  >
                    {loading ? 'Processing...' : `Pay with Wallet`}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 🆕 DEBUG INFO */}
       
      </div>
    </div>
  );
}

export default function PaymentModal(props) {
  // 🆕 ADD PROP VALIDATION
  useEffect(() => {
    console.log('🎯 PaymentModal Props:', props);
    if (!props.event) {
      console.error('❌ PaymentModal: No event prop provided');
    }
  }, [props]);

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}