import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import tripClient from "../apis/tripClient.js"; // Use the new client
import FavoriteButton from '../components/FavoriteButton';
import axios from "axios";

export default function TripManagement() {
  const [trips, setTrips] = useState([]);
  const [formData, setFormData] = useState({
    tripName: "", // Changed to match backend
    Destination: "", // Changed to match backend
    startDateTime: "", // Changed to match backend
    endDateTime: "", // Changed to match backend
    price: "",
    capacity: "",
    deadlineRegDate: "",
    Description: "", // Changed to match backend
    allowedRoles: []
  });
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await tripClient.get("/");
        setTrips(res.data);
      } catch (err) {
        console.error("Failed to load trips:", err);
      }
    };
    fetchTrips();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleRole = (role) => {
    setFormData(s => {
      const setRoles = new Set(s.allowedRoles || []);
      const r = String(role).toLowerCase();
      if (setRoles.has(r)) setRoles.delete(r); else setRoles.add(r);
      return { ...s, allowedRoles: Array.from(setRoles) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editData) {
        res = await tripClient.put(`/${editData._id}`, formData);
        setTrips(prev =>
          Array.isArray(prev)
            ? prev.map(t => (t._id === editData._id ? res.data : t))
            : [res.data]
        );
      } else {
        res = await tripClient.post("/", formData);
        setTrips(prev =>
          Array.isArray(prev) ? [...prev, res.data] : [res.data]
        );
      }

      setEditData(null);
      setFormData({
        tripName: "",
        Destination: "",
        startDateTime: "",
        endDateTime: "",
        price: "",
        capacity: "",
        deadlineRegDate: "",
        Description: "",
        allowedRoles: []
      });
    } catch (err) {
      console.error("Error saving trip:", err.response?.data || err.message);
    }
  };

  // Filter upcoming and past trips
  const now = Date.now();
  const upcomingTrips = Array.isArray(trips)
    ? trips.filter(t => new Date(t.startDateTime).getTime() > now)
    : [];
  const pastTrips = Array.isArray(trips)
    ? trips.filter(t => new Date(t.startDateTime).getTime() <= now)
    : [];

  const getDaysUntil = (date) => {
    const diff = new Date(date).getTime() - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-1/2 -right-40 animate-ping" />
        <div className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -bottom-20 left-1/2 animate-bounce" />
      </div>

      {/* Header with Return to Admin Button */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8">
        <Link 
          to="/admin"
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl backdrop-blur-xl border border-white/30 transition-all hover:scale-105 flex items-center gap-2"
        >
          ⬅️ Return to Admin
        </Link>
        
        <motion.h1 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-center drop-shadow-2xl"
        >
          ✈️ Travel Hub
        </motion.h1>
        
        {/* Export Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            try {
              setLoading(true);
              const response = await axios.get('http://localhost:4000/api/export/trips', {
                responseType: 'blob',
                withCredentials: true,
              });
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'trips_registrations.xlsx');
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
              setMessage("✅ Trips exported successfully!");
              setTimeout(() => setMessage(""), 3000);
            } catch (err) {
              console.error('Export failed:', err);
              setMessage("❌ Failed to export trips");
              setTimeout(() => setMessage(""), 3000);
            } finally {
              setLoading(false);
            }
          }}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl backdrop-blur-xl border border-green-400/30 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Trips
        </motion.button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mb-4 px-6 py-3 rounded-xl backdrop-blur-xl border ${
            message.includes('✅') 
              ? 'bg-green-500/20 border-green-500/50 text-green-200' 
              : 'bg-red-500/20 border-red-500/50 text-red-200'
          }`}
        >
          {message}
        </motion.div>
      )}

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-cyan-200/80 mb-12 text-center max-w-2xl"
      >
        Discover amazing trips and create unforgettable memories around the world!
      </motion.p>

      {/* Search with Glass Effect */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl mb-12"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg"></div>
        <input
          type="text"
          placeholder="🔍 Search for your next destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="relative w-full px-6 py-4 rounded-2xl text-white placeholder-cyan-200 bg-black/40 backdrop-blur-xl border border-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all shadow-2xl"
        />
      </motion.div>

      {/* Create Trip Card */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-2xl p-8 space-y-6 bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all group"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-2xl">
            🗺️
          </div>
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Plan New Trip
            </h2>
            <p className="text-cyan-200/60 text-sm">Create your next amazing journey</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="tripName" // Updated to match backend
              placeholder="🏷️ Trip Name"
              value={formData.tripName}
              onChange={handleChange}
              className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              required
            />
            
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="Destination" // Updated to match backend
              placeholder="📍 Destination"
              value={formData.Destination}
              onChange={handleChange}
              className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="number"
              name="price"
              placeholder="💰 Price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              required
            />

            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="number"
              name="capacity"
              placeholder="👥 Capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              required
            />

            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="datetime-local"
              name="deadlineRegDate"
              value={formData.deadlineRegDate}
              onChange={handleChange}
              className="w-full px-5 py-4 text-white bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-cyan-300 font-medium mb-2 block">📅 Start Date & Time</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="datetime-local"
                name="startDateTime" // Updated to match backend
                value={formData.startDateTime}
                onChange={handleChange}
                className="w-full px-5 py-4 text-white bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-cyan-300 font-medium mb-2 block">🏁 End Date & Time</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="datetime-local"
                name="endDateTime" // Updated to match backend
                value={formData.endDateTime}
                onChange={handleChange}
                className="w-full px-5 py-4 text-white bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                required
              />
            </div>
          </div>

          <motion.textarea
            whileFocus={{ scale: 1.02 }}
            name="Description" // Updated to match backend
            placeholder="📖 Trip description and highlights..."
            value={formData.Description}
            onChange={handleChange}
            rows="3"
            className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
            required
          />

          {/* Role Access Restriction */}
          <div>
            <label className="block text-cyan-300 font-medium mb-3">
              🔐 Restrict Access (leave empty for public)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['student','staff','ta','professor','vendor','admin','eventoffice'].map(r => (
                <label key={r} className="inline-flex items-center text-white/90 bg-black/30 px-4 py-3 rounded-lg hover:bg-black/50 border border-cyan-500/20 hover:border-cyan-400/40 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.allowedRoles || []).includes(r)}
                    onChange={() => toggleRole(r)}
                    className="mr-2 w-4 h-4 rounded border-cyan-400/30 focus:ring-2 focus:ring-cyan-400"
                  />
                  <span className="font-semibold">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                </label>
              ))}
            </div>
            <p className="text-cyan-200/60 text-sm mt-3">✨ Select specific roles to restrict who can view and register for this trip</p>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl transform transition-all shadow-2xl hover:shadow-cyan-500/25"
          >
            ✈️ {editData ? "Update Trip" : "Create Trip"}
          </motion.button>
        </form>
      </motion.div>

      {/* Upcoming Trips */}
      <div className="w-full max-w-6xl mt-12">
        <h2 className="text-3xl font-bold text-white mb-6">Upcoming Trips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {upcomingTrips.length ? (
              upcomingTrips
                .filter((t) => t.tripName?.toLowerCase().includes(search.toLowerCase()))
                .map((trip) => (
                  <motion.div
                    key={trip._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="relative">
                      <Link
                        to={`/trips/edit/${trip._id}`}
                        className="block p-6 backdrop-blur-xl rounded-2xl border shadow-2xl transition-all bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-cyan-500/25 text-white hover:bg-black/60"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-bold text-white mb-2">{trip.tripName}</h3>
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            ✈️
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-cyan-200 flex items-center gap-2">
                            <span>📍</span> {trip.Destination}
                          </p>
                          <p className="text-emerald-300 flex items-center gap-2">
                            <span>💰</span> ${trip.price}
                          </p>
                          <p className="text-purple-300 flex items-center gap-2">
                            <span>👥</span> {trip.capacity} travelers
                          </p>
                          <p className="text-orange-300 text-sm">
                            ⏰ {getDaysUntil(trip.deadlineRegDate)} days to register
                          </p>
                        </div>

                        <p className="text-white/70 text-sm mb-4 line-clamp-2">{trip.Description}</p>
                        <div className="text-sm text-cyan-300">
                          Click to edit trip
                        </div>
                      </Link>

                      <div className="absolute top-4 right-4">
                        <FavoriteButton tripId={trip._id} size="small" />
                      </div>
                    </div>
                  </motion.div>
                ))
            ) : (
              <p className="text-cyan-300 col-span-full text-center py-8">
                No upcoming trips. Create your first adventure!
              </p>
            )}
          </AnimatePresence>
        </div>

        {/* Past Trips */}
        <h2 className="text-3xl font-bold text-white mt-12 mb-6">Past Trips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {pastTrips.length ? (
              pastTrips
                .filter((t) => t.tripName?.toLowerCase().includes(search.toLowerCase()))
                .map((trip) => (
                  <motion.div
                    key={trip._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="relative p-6 bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-600/30 text-slate-400 opacity-80 cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">{trip.tripName}</h3>
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        ✅
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-cyan-200 flex items-center gap-2">
                        <span>📍</span> {trip.Destination}
                      </p>
                      <p className="text-emerald-300 flex items-center gap-2">
                        <span>💰</span> ${trip.price}
                      </p>
                      <p className="text-purple-300 flex items-center gap-2">
                        <span>👥</span> {trip.capacity} travelers
                      </p>
                    </div>

                    <p className="text-white/70 text-sm mb-4 line-clamp-2">{trip.Description}</p>
                    <p className="text-sm text-slate-400 italic">Trip completed</p>
                    <div className="absolute top-4 right-4">
                      <FavoriteButton tripId={trip._id} size="small" />
                    </div>
                  </motion.div>
                ))
            ) : (
              <p className="text-cyan-300 col-span-full text-center py-8">
                No past trips. Your travel memories will appear here!
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div> 
  );
}