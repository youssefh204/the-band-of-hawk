import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../apis/vendorClient.js';
import axios from 'axios';

export default function EnhancedParticipationCard({ application, onPaymentSuccess }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getAppStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handlePay = async () => {
    try {
      setLoading(true);
      // Use direct axios call to avoid /api/vendor prefix from vendorClient
      await axios.post('http://localhost:4000/api/payments/vendor-application', {
        applicationId: application._id,
        paymentMethod: 'wallet'
      }, { withCredentials: true });

      alert('Payment successful! QR codes have been sent to attendees.');
      setShowPaymentModal(false);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      console.error('Payment failed:', err);
      alert(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('idDocuments', file);
    fd.append('applicationId', application._id);
    fd.append('attendeeIndex', index);

    try {
      setLoading(true);
      await api.post('/upload-attendee-ids', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('ID uploaded successfully!');
      if (onPaymentSuccess) onPaymentSuccess(); // Refresh data
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload ID');
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = async (id) => {
  if (!window.confirm("Are you sure you want to cancel your participation?")) return;

  try {
    setLoading(true);
    await api.delete(`/applications/${id}/cancel`);
    alert('Your participation request has been cancelled.');
    if (onPaymentSuccess) onPaymentSuccess(); // refresh list
  } catch (err) {
    alert(err.response?.data?.message || "Failed to cancel application");
  } finally {
    setLoading(false);
  }
};

  const handleCancelLoyalty = async (id) => {
    if (!window.confirm('Are you sure you want to cancel your participation in the loyalty program?')) return;
    try {
      setLoading(true);
      await api.delete(`/loyalty/${id}/cancel`);
      alert('Your loyalty participation has been cancelled.');
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      console.error('Failed to cancel loyalty application:', err);
      alert(err.response?.data?.message || 'Failed to cancel loyalty application');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="border border-green-200 bg-green-50 rounded-xl p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-bold text-lg text-gray-800">
                {application.type === 'loyalty' ? 'GUC Loyalty Program' : (application.bazaarId?.bazaarName || 'Campus Booth')}
              </h4>
              {application.type !== 'loyalty' && (
                <span className={`${getPaymentStatusColor(application.paymentStatus)} text-white px-2 py-0.5 rounded text-xs font-semibold`}>
                  {application.paymentStatus === 'paid' ? '💳 Paid' : '⏳ Payment Pending'}
                </span>
              )}
            </div>
<div className="text-sm text-gray-600 space-y-1">
  {application.type === 'loyalty' ? (
    <div className="text-sm text-gray-600 space-y-1">
      <p>💰 Discount Rate: {application.discountRate}%</p>
      <p>🏷️ Promo Code: {application.promoCode}</p>
      <p className="text-xs mt-1">📜 Terms: {application.termsAndConditions}</p>
    </div>
  ) : (
    <>
      <p>📍 {application.bazaarId?.location || application.location}</p>
      <p>📏 Booth Size: {application.boothSize}</p>
      {application.duration && <p>⏱️ Duration: {application.duration} week(s)</p>}
      <p>👥 Attendees: {application.attendees?.length || 0}</p>
      {application.price && <p className="font-semibold text-gray-800">💰 Price: ${application.price}</p>}
      {application.paymentDeadline && application.paymentStatus !== 'paid' && (
        <p className="text-red-600 font-medium">
          ⏰ Payment due: {new Date(application.paymentDeadline).toLocaleDateString()}
          {getDaysRemaining(application.paymentDeadline) !== null && (
            <span className="ml-2 text-xs">({getDaysRemaining(application.paymentDeadline)} days left)</span>
          )}
        </p>
      )}
    </>
  )}
</div>

          </div>
          <div className="flex flex-col gap-2">
            {application.type !== 'loyalty' && (
              <>
                {application.status === "rejected" && application.adminNotes?.includes("cancelled") ? (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm text-center">Cancelled ❌</span>
                ) : (
                  <span className={`${getAppStatusColor(application.status)} text-white px-3 py-1 rounded-full text-sm text-center`}>
                    {application.status === 'approved' ? 'Approved ✅' : application.status === 'pending' ? 'Pending ⏳' : 'Status: ' + application.status}
                  </span>
                )}
              </>
            )}

            {application.type !== 'loyalty' && (
              <>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  📤 Upload IDs
                </button>
                {application.paymentStatus !== 'paid' ? (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    💳 Pay Now
                  </button>
                )
                 
                : (
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    🎫 View QR Codes
                  </button>
                  )}
                </>
                )}
                  {application.paymentStatus === 'pending' && (
              <button
                onClick={() => handleCancel(application._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ❌ Cancel Request
              </button>
            )}

                {application.type === 'loyalty' && application.status !== 'rejected' && (
              <button
                onClick={() => handleCancelLoyalty(application._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ❌ Cancel Participation
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold mb-4">💳 Payment Confirmation</h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Event:</p>
              <p className="font-semibold text-lg">{application.bazaarId?.bazaarName || 'Campus Booth'}</p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booth Size:</span>
                  <span className="font-medium">{application.boothSize}</span>
                </div>
                {application.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{application.duration} week(s)</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t">
                  <span>Total Amount:</span>
                  <span className="text-green-600">${application.price}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Payment will be deducted from your wallet balance. QR codes for all attendees will be sent via email after successful payment.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 font-medium"
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </motion.div >
        </div >
      )
      }

      {/* QR Codes Modal */}
      {
        showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">🎫 Attendee QR Codes</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Event:</strong> {application.bazaarId?.bazaarName || 'Campus Booth'}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  These QR codes have been sent to each attendee email for entry verification.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {application.attendees.map((attendee, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="mb-3">
                      <p className="font-semibold text-gray-800">{attendee.name}</p>
                      <p className="text-xs text-gray-600">{attendee.email}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-6 flex items-center justify-center aspect-square">
                      <div className="text-center">
                        <div className="text-6xl mb-2">⬛</div>
                        <p className="text-xs text-gray-600 font-mono">QR-{application._id.slice(-6)}-{index}</p>
                        <p className="text-xs text-gray-500 mt-1">Sent to email</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Upload IDs Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">📤 Upload Attendee IDs</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Please upload a valid ID document for each attendee. This is required for security verification.
            </p>

            <div className="space-y-4">
              {application.attendees.map((attendee, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800">{attendee.name}</p>
                    <p className="text-sm text-gray-600">{attendee.email}</p>
                    {attendee.idDocumentUrl ? (
                      <a
                        href={`http://localhost:4000${attendee.idDocumentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 font-medium mt-1 inline-block hover:underline"
                      >
                        ✅ ID Uploaded (View)
                      </a>
                    ) : (
                      <p className="text-xs text-red-500 font-medium mt-1">❌ ID Missing</p>
                    )}
                  </div>

                  <label className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}>
                    {loading ? 'Uploading...' : (attendee.idDocumentUrl ? 'Re-upload ID' : 'Upload ID')}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, index)}
                      disabled={loading}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
