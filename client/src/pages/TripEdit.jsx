import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import tripClient from "../apis/tripClient.js";
import { motion } from "framer-motion";

export default function TripEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tripName: "",
    Destination: "",
    startDateTime: "",
    endDateTime: "",
    price: "",
    capacity: "",
    deadlineRegDate: "",
    Description: "",
    allowedRoles: [],
  });

  // ✅ Format ISO date to "YYYY-MM-DDTHH:MM"
  const formatDateForInput = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await tripClient.get(`/${id}`);
        const t = res.data;

        setFormData({
          tripName: t.tripName || "",
          Destination: t.Destination || "",
          startDateTime: formatDateForInput(t.startDateTime),
          endDateTime: formatDateForInput(t.endDateTime),
          price: t.price || "",
          capacity: t.capacity || "",
          deadlineRegDate: formatDateForInput(t.deadlineRegDate),
          Description: t.Description || "",
          allowedRoles: (t.allowedRoles || []).map(r => String(r).toLowerCase()),
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching trip:", err.response?.data || err.message);
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      await tripClient.put(`/${id}`, formData);
      navigate("/trips"); // ✅ go back to trips page
    } catch (err) {
      console.error("Error updating trip:", err.response?.data || err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-2xl">
        Loading Trip Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-1/2 -right-40 animate-ping" />
        <div className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -bottom-20 left-1/2 animate-bounce" />
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-8 text-center drop-shadow-2xl"
      >
        ✏️ Edit Trip
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-8 space-y-6 bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all group"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Trip Name */}
          <input
            type="text"
            name="tripName"
            placeholder="🏷️ Trip Name"
            value={formData.tripName}
            onChange={handleChange}
            required
            className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
          />

          {/* Destination */}
          <input
            type="text"
            name="Destination"
            placeholder="📍 Destination"
            value={formData.Destination}
            onChange={handleChange}
            required
            className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
          />

          {/* Price & Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-cyan-300 font-medium mb-2 block">💰 Price</label>
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              />
            </div>
            <div>
              <label className="text-cyan-300 font-medium mb-2 block">👥 Capacity</label>
              <input
                type="number"
                name="capacity"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-cyan-300 font-medium mb-2 block">📅 Start Date</label>
              <input
                type="datetime-local"
                name="startDateTime"
                value={formData.startDateTime}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 text-white bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              />
            </div>
            <div>
              <label className="text-cyan-300 font-medium mb-2 block">🏁 End Date</label>
              <input
                type="datetime-local"
                name="endDateTime"
                value={formData.endDateTime}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 text-white bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              />
            </div>
            <div>
              <label className="text-cyan-300 font-medium mb-2 block">📝 Registration Deadline</label>
              <input
                type="datetime-local"
                name="deadlineRegDate"
                value={formData.deadlineRegDate}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 text-white bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <textarea
            name="Description"
            placeholder="📖 Trip description and highlights..."
            value={formData.Description}
            onChange={handleChange}
            rows="4"
            className="w-full px-5 py-4 text-white placeholder-cyan-200 bg-black/40 backdrop-blur-lg rounded-xl border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
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

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/trips")}
              className="flex-1 py-4 font-bold text-white bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 rounded-xl transform transition-all shadow-2xl"
            >
              ↩️ Cancel
            </button>
            <button
              type="submit"
              onClick={() => navigate("/trips")}
              className="flex-1 py-4 font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl transform transition-all shadow-2xl hover:shadow-cyan-500/25"
            >
              💾 Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}