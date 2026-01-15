import React, { useState, useEffect } from "react";
import EnhancedParticipationCard from "../components/EnhancedParticipationCard.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import api from "../apis/vendorClient.js";
import bazaarClient from "../apis/bazaarClient";
import { motion } from "framer-motion";

const VendorDash = () => {
  const [bazaars, setBazaars] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [appliedBazaarIds, setAppliedBazaarIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showBoothModal, setShowBoothModal] = useState(false);
  const [selectedBazaar, setSelectedBazaar] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  const [applicationForm, setApplicationForm] = useState({
    attendees: [{ name: "", email: "" }],
    boothSize: "2x2"
  });
  const [boothForm, setBoothForm] = useState({
    attendees: [{ name: "", email: "" }],
    duration: "1",
    location: "",
    boothSize: "2x2"
  });
const [loyaltyForm, setLoyaltyForm] = useState({
  discountRate: "",
  promoCode: "",
  termsAndConditions: ""
});

  // Sample locations on platform
  const platformLocations = [
    "Main Plaza - Near Fountain",
    "Student Center - Ground Floor",
    "Campus Mall - Central Area",
    "Sports Complex - Entrance",
    "Library Square",
    "Food Court Area",
    "Academic Building A - Lobby",
    "Parking Lot B - Front Row"
  ];
  const [logoUrl, setLogoUrl] = useState(null);
  const [taxCardUrl, setTaxCardUrl] = useState(null);

  const uploadLogo = async (e) => {
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append("logo", file);

    try {
      const res = await api.post("/upload-logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogoUrl(res.data.url);
      alert("Logo uploaded successfully!");
    } catch (err) {
      console.error("Logo upload failed:", err);
    }
  };

  const uploadTaxCard = async (e) => {
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append("taxCard", file);

    try {
      const res = await api.post("/upload-taxcard", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTaxCardUrl(res.data.url);
      alert("Tax card uploaded successfully!");
    } catch (err) {
      console.error("Tax card upload failed:", err);
    }
  };


  useEffect(() => {
    fetchBazaars();
    fetchMyApplications();
  }, []);

  // Keep a set of bazaars the vendor already applied to to prevent duplicate submissions
  useEffect(() => {
    const ids = new Set(
      (myApplications || [])
        .map((a) => {
          // populated bazaarId may be an object or an id string
          return a.bazaarId?._id || a.bazaarId || a.bazaar;
        })
        .filter(Boolean)
    );
    setAppliedBazaarIds(ids);
  }, [myApplications]);

  const fetchBazaars = async () => {
    try {
      setLoading(true);
      // Use the bazaar client instead of vendor client for bazaars
      const res = await bazaarClient.get("/"); // This gets all bazaars
      // Or filter upcoming bazaars on frontend
      const upcomingBazaars = (res.data.data || res.data || []).filter(bazaar =>
        new Date(bazaar.RegDeadline) > new Date()
      );
      setBazaars(upcomingBazaars);
    } catch (err) {
      console.error("Failed to fetch bazaars:", err);
      // Fallback to empty array
      setBazaars([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await api.get("/applications/my");
      setMyApplications(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      // Fallback to empty array
      setMyApplications([]);
    }
  };

  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err?.message || err);
    }
    navigate("/login");
  };

  const handleAddAttendee = (formType) => {
    const form = formType === 'bazaar' ? applicationForm : boothForm;
    const setForm = formType === 'bazaar' ? setApplicationForm : setBoothForm;

    if (form.attendees.length < 5) {
      setForm({
        ...form,
        attendees: [...form.attendees, { name: "", email: "" }]
      });
    }
  };

  const handleRemoveAttendee = (index, formType) => {
    const form = formType === 'bazaar' ? applicationForm : boothForm;
    const setForm = formType === 'bazaar' ? setApplicationForm : setBoothForm;

    if (form.attendees.length > 1) {
      const newAttendees = form.attendees.filter((_, i) => i !== index);
      setForm({ ...form, attendees: newAttendees });
    }
  };

  const handleAttendeeChange = (index, field, value, formType) => {
    const form = formType === 'bazaar' ? applicationForm : boothForm;
    const setForm = formType === 'bazaar' ? setApplicationForm : setBoothForm;

    const newAttendees = form.attendees.map((attendee, i) =>
      i === index ? { ...attendee, [field]: value } : attendee
    );
    setForm({ ...form, attendees: newAttendees });
  };

  const submitBazaarApplication = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/applications/bazaar", {
        bazaarId: selectedBazaar._id,
        ...applicationForm
      });
      setShowApplyModal(false);
      fetchMyApplications();
      alert("Application submitted successfully!");
    } catch (err) {
      console.error("Failed to submit application:", err);
      alert(err.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

const submitBoothApplication = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    const res = await api.post("/applications/booth", boothForm);

    // 🔥 Force notification for EventOffice
    await api.post("http://localhost:4000/api/notifications", {
      message: `🛍️ Booth Request Submitted by Vendor`,
      type: "info",
      userRoles: ["eventoffice"], // EventOffice sees it
    });

    setShowBoothModal(false);
    fetchMyApplications();
    alert("Booth application submitted successfully!");
  } catch (err) {
    console.error("Failed to submit booth application:", err);
    alert(err.response?.data?.message || "Failed to submit application");
  } finally {
    setLoading(false);
  }
};

const submitLoyaltyApplication = async (e) => {
  e.preventDefault();
  
  // Validate form data BEFORE setting loading
  if (!loyaltyForm.discountRate || !loyaltyForm.promoCode || !loyaltyForm.termsAndConditions) {
    alert('Please fill in all fields');
    return;
  }

  try {
    setLoading(true);
    console.log('Submitting loyalty application:', loyaltyForm);

    const res = await api.post('/loyalty/apply', {
      discountRate: Number(loyaltyForm.discountRate),
      promoCode: loyaltyForm.promoCode.trim(),
      termsAndConditions: loyaltyForm.termsAndConditions.trim(),
    });

    console.log('Loyalty application response:', res.data);
    alert(res.data.message || 'Loyalty application submitted successfully!');
    setShowApplyModal(false);
    setLoyaltyForm({
      discountRate: '',
      promoCode: '',
      termsAndConditions: '',
    });
    fetchMyApplications();
  } catch (err) {
    console.error('Failed to submit loyalty application:', err);
    const errorMsg = err.response?.data?.message || err.message || 'Failed to submit loyalty application';
    console.error('Error details:', { status: err.response?.status, data: err.response?.data });
    alert(errorMsg);
  } finally {
    setLoading(false);
  }
};




  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Treat loyalty applications as participations so vendors can manage/cancel them
  const acceptedApplications = myApplications.filter(app => app.status === 'approved' || app.type === 'loyalty');
  const pendingApplications = myApplications.filter(app => app.status === 'pending' && app.type !== 'loyalty');
  const rejectedApplications = myApplications.filter(app => app.status === 'rejected' && app.type !== 'loyalty');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8">
      {/* Header */}
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-orange-200"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🏪 Vendor Dashboard</h1>
              <p className="text-gray-600">Manage your bazaar and booth applications</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Welcome back,</p>
                  <p className="font-semibold text-gray-800">
                    {JSON.parse(localStorage.getItem('user'))?.companyName || 'Vendor'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Upload Section */}
        <div className="mt-6 flex gap-4">

          {/* Upload Logo */}
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700">
            Upload Logo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadLogo}
            />
          </label>

          {/* Upload Tax Card */}
          <label className="bg-purple-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-700">
            Upload Tax Card
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={uploadTaxCard}
            />
          </label>

        </div>
        {logoUrl && (
          <a
            href={logoUrl}
            target="_blank"
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            View Logo
          </a>
        )}

        {taxCardUrl && (
          <a
            href={taxCardUrl}
            target="_blank"
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            View Tax Card
          </a>
        )}



        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          <button
            onClick={() => setShowBoothModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-xl shadow-md transition-all transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🛍️</div>
              <h3 className="font-bold">Apply for Campus Booth</h3>
              <p className="text-sm opacity-90">Set up a booth on campus</p>
            </div>
          </button>

          <button
            onClick={() => {
              setSelectedBazaar({ bazaarName: 'GUC Loyalty Program' });
              setShowApplyModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-md transition-all transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">💳</div>
              <h3 className="font-bold">Apply to Loyalty Program</h3>
              <p className="text-sm opacity-90">Offer discounts via promo codes</p>
            </div>
          </button>

        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-200 mb-6">
          <div className="flex border-b border-gray-200">
            {['upcoming', 'participating', 'requests'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 font-medium transition-all ${activeTab === tab
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab === 'upcoming' && '📅 Upcoming Bazaars'}
                {tab === 'participating' && '✅ My Participations'}
                {tab === 'requests' && '📋 My Applications'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'upcoming' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Upcoming Bazaars ({bazaars.length})
                </h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    <p className="text-gray-600 mt-2">Loading bazaars...</p>
                  </div>
                ) : bazaars.length > 0 ? (
                  bazaars.map((bazaar) => (
                    <div
                      key={bazaar._id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-800">
                            {bazaar.bazaarName}
                            {appliedBazaarIds.has(bazaar._id) && (
                              <span className="ml-3 inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                                You applied
                              </span>
                            )}
                          </h4>
                          <p className="text-gray-600 mb-2">{bazaar.Description}</p>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>📍 {bazaar.location}</p>
                            <p>📅 {new Date(bazaar.startDate).toLocaleDateString()} - {new Date(bazaar.endDate).toLocaleDateString()}</p>
                            <p>⏰ Registration closes: {new Date(bazaar.RegDeadline).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {appliedBazaarIds.has(bazaar._id) ? (
                          <button
                            disabled
                            className="ml-4 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg cursor-not-allowed"
                          >
                            Applied
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBazaar(bazaar);
                              setShowApplyModal(true);
                            }}
                            className="ml-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎪</div>
                    <p>No upcoming bazaars at the moment.</p>
                  </div>
                )}
              </div>
            )}

{activeTab === 'participating' && (
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-gray-800 mb-4">
      My Participations ({acceptedApplications.length})
    </h3>

    

    {acceptedApplications.length > 0 ? (
      acceptedApplications.map((app) => (
        <EnhancedParticipationCard
          key={app._id}
          application={app}
          onPaymentSuccess={fetchMyApplications}
        />
      ))
    ) : (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📭</div>
        <p>No approved participations yet.</p>
        <p className="text-sm">Apply to bazaars or booths to get started!</p>
      </div>
    )}
  </div>
)}


            {activeTab === 'requests' && (
              <div className="space-y-6">
                
                {/* Pending Applications */}
                <div>
                  <h4 className="font-bold text-lg text-gray-800 mb-3">
                    Pending Applications ({pendingApplications.length})
                  </h4>
                  {pendingApplications.length > 0 ? (
                    pendingApplications.map((app) => (
                      <div
                        key={app._id}
                        className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 mb-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold">
                              {app.bazaarId?.bazaarName || 'Campus Booth'}
                            </h5>
                            <p className="text-sm text-gray-600">
                              Booth: {app.boothSize} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
                            Pending ⏳
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No pending applications</p>
                  )}
                </div>

                {/* Rejected Applications */}
                <div>
                  <h4 className="font-bold text-lg text-gray-800 mb-3">
                    Rejected Applications ({rejectedApplications.length})
                  </h4>
                  {rejectedApplications.length > 0 ? (
                    rejectedApplications.map((app) => (
                      <div
                        key={app._id}
                        className="border border-red-200 bg-red-50 rounded-xl p-4 mb-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold">
                              {app.bazaarId?.bazaarName || 'Campus Booth'}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {app.boothSize} • {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                            Rejected ❌
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No rejected applications</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

{/* Apply Modal: Bazaar or Loyalty */}
{showApplyModal && selectedBazaar?.bazaarName === 'GUC Loyalty Program' ? (
  // Loyalty Program Modal
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <h3 className="text-xl font-bold mb-4">Apply to {selectedBazaar?.bazaarName}</h3>
      <form onSubmit={submitLoyaltyApplication}>
        {/* Discount Rate */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Rate (%)
          </label>
          <input
            type="number"
            value={loyaltyForm.discountRate}
            onChange={(e) =>
              setLoyaltyForm({ ...loyaltyForm, discountRate: e.target.value })
            }
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Promo Code */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Promo Code
          </label>
          <input
            type="text"
            value={loyaltyForm.promoCode}
            onChange={(e) =>
              setLoyaltyForm({ ...loyaltyForm, promoCode: e.target.value })
            }
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Terms & Conditions */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Terms and Conditions
          </label>
          <textarea
            value={loyaltyForm.termsAndConditions}
            onChange={(e) =>
              setLoyaltyForm({ ...loyaltyForm, termsAndConditions: e.target.value })
            }
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setShowApplyModal(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </motion.div>
  </div>
) : showApplyModal && selectedBazaar ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold mb-4">Apply to {selectedBazaar?.bazaarName}</h3>

            <form onSubmit={submitBazaarApplication}>
              {/* Booth Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booth Size
                </label>
                <div className="flex gap-4">
                  {['2x2', '4x4'].map((size) => (
                    <label key={size} className="flex items-center">
                      <input
                        type="radio"
                        name="boothSize"
                        value={size}
                        checked={applicationForm.boothSize === size}
                        onChange={(e) => setApplicationForm({ ...applicationForm, boothSize: e.target.value })}
                        className="mr-2"
                      />
                      {size} meters
                    </label>
                  ))}
                </div>
              </div>

              {/* Attendees */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Attendees (Max 5)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddAttendee('bazaar')}
                    disabled={applicationForm.attendees.length >= 5}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
                  >
                    + Add Attendee
                  </button>
                </div>

                {applicationForm.attendees.map((attendee, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={attendee.name}
                      onChange={(e) => handleAttendeeChange(index, 'name', e.target.value, 'bazaar')}
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={attendee.email}
                      onChange={(e) => handleAttendeeChange(index, 'email', e.target.value, 'bazaar')}
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                      required
                    />
                    {applicationForm.attendees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(index, 'bazaar')}
                        className="bg-red-500 text-white px-3 rounded"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
) : null}

      {/* Apply for Campus Booth Modal */}
      {showBoothModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold mb-4">Apply for Campus Booth</h3>

            <form onSubmit={submitBoothApplication}>
              {/* Duration */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Weeks)
                </label>
                <select
                  value={boothForm.duration}
                  onChange={(e) => setBoothForm({ ...boothForm, duration: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  {[1, 2, 3, 4].map(week => (
                    <option key={week} value={week}>{week} week{week > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Location
                </label>
                <select
                  value={boothForm.location}
                  onChange={(e) => setBoothForm({ ...boothForm, location: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select a location</option>
                  {platformLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Booth Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booth Size
                </label>
                <div className="flex gap-4">
                  {['2x2', '4x4'].map((size) => (
                    <label key={size} className="flex items-center">
                      <input
                        type="radio"
                        name="boothSize"
                        value={size}
                        checked={boothForm.boothSize === size}
                        onChange={(e) => setBoothForm({ ...boothForm, boothSize: e.target.value })}
                        className="mr-2"
                      />
                      {size} meters
                    </label>
                  ))}
                </div>
              </div>

              {/* Attendees */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Attendees (Max 5)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddAttendee('booth')}
                    disabled={boothForm.attendees.length >= 5}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
                  >
                    + Add Attendee
                  </button>
                </div>

                {boothForm.attendees.map((attendee, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={attendee.name}
                      onChange={(e) => handleAttendeeChange(index, 'name', e.target.value, 'booth')}
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={attendee.email}
                      onChange={(e) => handleAttendeeChange(index, 'email', e.target.value, 'booth')}
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                      required
                    />
                    {boothForm.attendees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(index, 'booth')}
                        className="bg-red-500 text-white px-3 rounded"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBoothModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VendorDash;
