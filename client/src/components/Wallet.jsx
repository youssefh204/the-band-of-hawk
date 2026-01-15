// components/Wallet.jsx
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getWalletBalance, createWalletTopUpIntent, confirmWalletTopUp } from '../apis/paymentClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function StripeTopUpForm({ onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < 1) {
      setError('Minimum top-up amount is $1');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Creating wallet top-up intent for amount:', amount);
      
      // Create payment intent
      const res = await createWalletTopUpIntent({ amount: Number(amount) });
      
      if (!res.data.success) {
        setError(res.data.message || 'Failed to create payment intent');
        return;
      }

      console.log('✅ Payment intent created:', res.data);

      if (!stripe || !elements) {
        setError('Stripe not loaded');
        return;
      }

      // Confirm card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        res.data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          }
        }
      );

      if (stripeError) {
        console.error('❌ Stripe payment error:', stripeError);
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        console.log('✅ Stripe payment succeeded, confirming top-up...');
        
        // Confirm top-up on backend
        const confirmRes = await confirmWalletTopUp({ paymentIntentId: paymentIntent.id });
        
        if (confirmRes.data.success) {
          console.log('✅ Wallet top-up confirmed:', confirmRes.data);
          onSuccess(confirmRes.data.data.amountAdded);
        } else {
          setError(confirmRes.data.message || 'Top-up confirmation failed');
        }
      } else {
        setError(`Payment status: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error('❌ Top-up process error:', err);
      setError(err.response?.data?.message || err.message || 'Top-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">💳 Top Up Wallet</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white block mb-2">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <p className="text-white/50 text-xs mt-1">Minimum amount: $1.00</p>
          </div>

          <div>
            <label className="text-white block mb-2">Card Details</label>
            <div className="p-4 bg-white/10 rounded-lg border border-white/20">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#fff',
                      '::placeholder': {
                        color: '#a1a1aa',
                      },
                      iconColor: '#a1a1aa',
                    },
                  },
                  hidePostalCode: true,
                }}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm p-3 bg-red-400/10 rounded-lg border border-red-400/20">
              ⚠️ {error}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="text-blue-400 mt-0.5">🔒</div>
              <div className="text-blue-300 text-xs">
                Your payment is secure and encrypted. We use Stripe for safe payment processing.
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!stripe || loading || !amount}
              className="flex-1 bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  💳 Top Up ${amount || '0'}
                </>
              )}
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
      </div>
    </div>
  );
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showStripeTopUp, setShowStripeTopUp] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await getWalletBalance();
      if (res.data.success) {
        setWallet(res.data.data);
      } else {
        console.error('Failed to fetch wallet:', res.data.message);
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeTopUpSuccess = (amountAdded) => {
    setShowStripeTopUp(false);
    setMessage(`✅ Successfully added $${amountAdded} to your wallet!`);
    fetchWallet();
    setTimeout(() => setMessage(''), 5000);
  };

  if (loading && !wallet) {
    return (
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 w-96">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-white">Loading wallet...</span>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 w-96">
        <div className="text-red-400 text-center">Failed to load wallet</div>
      </div>
    );
  }

  // Calculate refunds for display
  const totalRefunds = wallet.transactionHistory
    ?.filter(t => t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  // Get recent transactions (last 5)
  const recentTransactions = wallet.transactionHistory?.slice(0, 5) || [];

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 w-96">
      <h3 className="text-xl font-bold text-white mb-4">💰 My Wallet</h3>
      
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          message.includes('✅') ? 'bg-green-500/20 border border-green-500/30 text-green-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {message}
        </div>
      )}
      
      {/* Balance Display */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 mb-4">
        <div className="text-2xl font-bold text-white mb-1">${wallet.walletBalance.toFixed(2)}</div>
        <div className="text-purple-300 text-sm">Available Balance</div>
      </div>

      {/* Refunds Display */}
      {totalRefunds > 0 && (
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-300 text-sm">Total Refunds</div>
              <div className="text-lg font-bold text-blue-300">+${totalRefunds.toFixed(2)}</div>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>
      )}

      {/* Top Up Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowStripeTopUp(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition shadow-lg flex items-center justify-center gap-2"
        >
          <span>💳</span>
          Top Up with Card
        </button>
        <p className="text-white/50 text-xs text-center mt-2">
          Secure payment via Stripe
        </p>
      </div>

      {/* Recent Transactions */}
      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>📊</span>
          Recent Transactions
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex-1">
                  <div className="text-white text-sm flex items-center gap-2">
                    {transaction.type === 'refund' && '💰 '}
                    {transaction.type === 'deposit' && '💳 '}
                    {transaction.type === 'payment' && '🎫 '}
                    {transaction.description}
                  </div>
                  <div className="text-white/50 text-xs mt-1">
                    {new Date(transaction.createdAt).toLocaleDateString()} • 
                    {transaction.eventType && ` ${transaction.eventType}`}
                  </div>
                </div>
                <div className={`font-semibold text-sm ${
                  transaction.amount > 0 
                    ? transaction.type === 'refund' ? 'text-blue-400' : 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-white/50 text-center py-6 border border-white/10 rounded-lg bg-white/5">
              <div className="text-2xl mb-2">💸</div>
              <div>No transactions yet</div>
              <div className="text-xs mt-1">Top up to get started!</div>
            </div>
          )}
        </div>
        
        {recentTransactions.length > 0 && (
          <button
            onClick={fetchWallet}
            className="w-full mt-3 text-white/70 text-sm hover:text-white transition flex items-center justify-center gap-1"
          >
            🔄 Refresh
          </button>
        )}
      </div>

      {/* Stripe Top-up Modal */}
      {showStripeTopUp && (
        <Elements stripe={stripePromise}>
          <StripeTopUpForm 
            onSuccess={handleStripeTopUpSuccess}
            onClose={() => setShowStripeTopUp(false)}
          />
        </Elements>
      )}
    </div>
  );
}