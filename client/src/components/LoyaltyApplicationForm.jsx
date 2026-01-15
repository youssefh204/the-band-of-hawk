import { useState } from 'react';
import api from '../apis/vendorClient.js'; // your Axios instance

export default function LoyaltyApplicationForm({ onSubmitSuccess }) {
  const [discountRate, setDiscountRate] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/loyalty/apply', { discountRate, promoCode, termsAndConditions: terms });
      alert('Application submitted successfully!');
      setDiscountRate('');
      setPromoCode('');
      setTerms('');
      if (onSubmitSuccess) onSubmitSuccess(res.data.application);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white border rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Apply for GUC Loyalty Program</h3>

      <label className="block mb-2 font-medium">Discount Rate (%)</label>
      <input
        type="number"
        min="1"
        max="100"
        value={discountRate}
        onChange={(e) => setDiscountRate(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        required
      />

      <label className="block mb-2 font-medium">Promo Code</label>
      <input
        type="text"
        value={promoCode}
        onChange={(e) => setPromoCode(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        required
      />

      <label className="block mb-2 font-medium">Terms and Conditions</label>
      <textarea
        value={terms}
        onChange={(e) => setTerms(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        {loading ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
}
