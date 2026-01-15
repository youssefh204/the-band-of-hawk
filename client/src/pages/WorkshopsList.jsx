import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../apis/workshopClient";
import FavoriteButton from '../components/FavoriteButton';
import PaymentModal from '../components/PaymentModal';
import { approveWorkshop, rejectWorkshop, requestWorkshopEdits } from "../apis/workshopClient";
import ExportAttendeesButton from "../components/ExportAttendeesButton";


export default function WorkshopsList() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creatorInput, setCreatorInput] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [message, setMessage] = useState("");
  
  // PAYMENT STATE
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  // Determine logged-in user role from localStorage
  let storedRole = null;
  try {
    const u = localStorage.getItem('user');
    if (u) storedRole = JSON.parse(u).role || null;
  } catch (e) {
    storedRole = null;
  }
  const userRole = storedRole;
  const userRoleNorm = userRole ? String(userRole).toLowerCase() : null;

  const creatorFromQuery = searchParams.get('creator') || '';

  useEffect(() => {
    const creator = creatorFromQuery;
    setCreatorInput(creator);
    fetchWorkshops(creator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWorkshops(creator) {
    try {
      setLoading(true);
      setError(null);
      let res;
      if (creator) {
        res = await api.get(`/workshops/creator/${encodeURIComponent(creator)}`);
      } else {
        res = await api.get('/workshops');
      }
      
      // 🆕 DEBUG: Check if workshops have price field
      console.log('Workshops data:', res.data.data);
      if (res.data.data && res.data.data.length > 0) {
        console.log('First workshop price:', res.data.data[0].price);
      }
      
      setWorkshops(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }

  // PAYMENT HANDLERS
  const handleRegisterClick = (workshop) => {
    console.log('Workshop price:', workshop.price, 'Type:', typeof workshop.price);
    
    // 🆕 FIX: Handle undefined/null prices and convert to number
    const workshopPrice = Number(workshop.price) || 0;
    
    if (workshopPrice > 0) {
      setSelectedWorkshop(workshop);
      setShowPaymentModal(true);
    } else {
      registerForFreeWorkshop(workshop._id);
    }
  };

  const handlePaymentSuccess = (payment) => {
    console.log('Payment successful:', payment);
    setShowPaymentModal(false);
    setSelectedWorkshop(null);
    setMessage('✅ Registration successful! Check your email for receipt.');
    setTimeout(() => setMessage(""), 5000);
  };

  const registerForFreeWorkshop = async (workshopId) => {
    try {
      // You'll need to implement this free registration API
      // For now, just show a success message
      setMessage('✅ Registered successfully for free workshop!');
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage('❌ Registration failed');
      setTimeout(() => setMessage(""), 3000);
    }
  };

  async function handleAction(id, action, note = "") {
    try {
      setMessage("");
      if (action === "approve") await approveWorkshop(id);
      else if (action === "reject") await rejectWorkshop(id);
      else if (action === "edit") await requestWorkshopEdits(id, note);

      setMessage(`✅ Workshop ${action}d successfully`);
      fetchWorkshops("");
    } catch (err) {
      console.error(err);
      setMessage(`❌ Failed to ${action} workshop`);
    }
  }

  function onSearchByCreator(e) {
    e.preventDefault();
    const creator = creatorInput.trim();
    if (creator) {
      setSearchParams({ creator });
      fetchWorkshops(creator);
    } else {
      setSearchParams({});
      fetchWorkshops('');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-500 animate-gradient-x py-8">
      {/* Navigation Links */}
      <div className="absolute top-6 left-6 right-6 flex justify-between">
        <Link
          to="/trips"
          className="text-white font-semibold bg-blue-500/40 hover:bg-blue-500/70 px-4 py-2 rounded-lg shadow-md backdrop-blur-md transition"
        >
          Manage Trips
        </Link>
        <Link
          to="/bazaars"
          className="text-white font-semibold bg-pink-500/40 hover:bg-pink-500/70 px-4 py-2 rounded-lg shadow-md backdrop-blur-md transition"
        >
          Go to Bazaar
        </Link>
        
        {/* PAID EVENTS LINK */}
        <Link
          to="/paid-events"
          className="text-white font-semibold bg-green-500/40 hover:bg-green-500/70 px-4 py-2 rounded-lg shadow-md backdrop-blur-md transition"
        >
          🎫 Paid Events
        </Link>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 mb-6">
            <h2 className="text-4xl font-extrabold text-center text-white drop-shadow-lg mb-2">
              Workshops
            </h2>
            <p className="text-white/80 text-center mb-6">
              Discover and manage academic workshops
            </p>

            {/* Create New Workshop Button */}
            <div className="flex justify-center gap-4 mb-6">
              <Link
                to="/workshops/new"
                className="px-6 py-3 font-bold text-white bg-pink-500 rounded-xl hover:bg-pink-600 transition-transform transform hover:scale-105 shadow-lg"
              >
                Create New Workshop
              </Link>
            </div>

            {/* Search Form */}
            <form onSubmit={onSearchByCreator} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <label className="text-white font-medium">
                  Filter by creator:
                </label>
                <input
                  value={creatorInput}
                  onChange={(e) => setCreatorInput(e.target.value)}
                  placeholder="e.g., ahmed.hassan@guc.edu.eg"
                  className="flex-1 px-4 py-2 text-white placeholder-white/70 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                />
                <button
                  type="submit"
                  className="px-6 py-2 font-medium text-white bg-purple-500 rounded-xl hover:bg-purple-600 transition"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => { setCreatorInput(''); setSearchParams({}); fetchWorkshops(''); }}
                  className="px-6 py-2 font-medium text-white bg-gray-500/50 rounded-xl hover:bg-gray-600/50 transition"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {message && (
            <div className="bg-green-500/30 border border-green-400/60 text-white text-center rounded-xl p-3 mb-4">
              {message}
            </div>
          )}

          {/* Loading & Error States */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white mt-2">Loading workshops...</p>
            </div>
          )}
 
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
              <p className="text-red-200 text-center">{error}</p>
            </div>
          )}

          {/* Workshops List */}
          {!loading && workshops.length === 0 && !error && (
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20">
              <p className="text-white/80 text-xl">No workshops found.</p>
            </div>
          )}

          <div className="space-y-4">
            {workshops.map((w) => {
              // 🆕 FIX: Convert price to number and handle undefined
              const workshopPrice = Number(w.price) || 0;
              const isPaidWorkshop = workshopPrice > 0;
              
              return (
                <div
                  key={w._id}
                  className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {w.workshopName}
                      </h3>
                      <div className="text-white/70 text-sm mb-2">
                        📍 {w.location} • 🗓️{" "}
                        {new Date(w.startDateTime).toLocaleString()} -{" "}
                        {new Date(w.endDateTime).toLocaleString()}
                        {/* PRICE DISPLAY - FIXED */}
                        {isPaidWorkshop && (
                          <span className="ml-2 text-green-400 font-semibold">
                            • 💰 ${workshopPrice}
                          </span>
                        )}
                      </div>
                      <p className="text-white/80 mb-3">{w.shortDescription}</p>
                      <div className="text-white/60 text-xs">
                        <span className="bg-purple-500/30 px-2 py-1 rounded mr-2">
                          🎓 {w.faculty}
                        </span>
                        <span className="bg-pink-500/30 px-2 py-1 rounded">
                          👤 {w.createdBy}
                        </span>
                        {/* PRICE BADGE - FIXED */}
                        {isPaidWorkshop && (
                          <span className="bg-green-500/30 px-2 py-1 rounded ml-2">
                            💰 Paid
                          </span>
                        )}
                        {!isPaidWorkshop && (
                          <span className="bg-blue-500/30 px-2 py-1 rounded ml-2">
                            🆓 Free
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* ACTION BUTTONS AREA */}
                    <div className="flex gap-2 items-center">
                      {userRole === "EventOffice" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(w._id, "approve")}
                            className="px-4 py-2 bg-green-500/60 hover:bg-green-600/70 text-white rounded-lg transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(w._id, "reject")}
                            className="px-4 py-2 bg-red-500/60 hover:bg-red-600/70 text-white rounded-lg transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              const note = prompt("Enter edit request note:");
                              if (note) handleAction(w._id, "edit", note);
                            }}
                            className="px-4 py-2 bg-yellow-500/60 hover:bg-yellow-600/70 text-white rounded-lg transition"
                          >
                            Request Edits
                          </button>
                        </div>
                      )}

                      {/* REGISTER BUTTON FOR STUDENTS/STAFF/TA/PROFESSORS - FIXED */}
                      {(userRoleNorm === 'student' || userRoleNorm === 'staff' || userRoleNorm === 'ta' || userRoleNorm === 'professor') && (
                        <button
                          onClick={() => handleRegisterClick(w)}
                          className={`px-4 py-2 rounded-lg font-semibold transition ${
                            isPaidWorkshop 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {isPaidWorkshop ? 'Register & Pay' : 'Register Free'}
                        </button>
                      )}

                      {/* Add Favorite Button for all users */}
                      <FavoriteButton workshopId={w._id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedWorkshop && (
        <PaymentModal
          event={selectedWorkshop}
          eventType="workshop"
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}