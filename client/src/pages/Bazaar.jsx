import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../apis/bazaarClient.js"; // axios instance
import { generateBazaarQR } from "../apis/bazaarClient.js";
import QRCodeModal from "../components/QRCodeModal";
import axios from "axios";

export default function Bazaar() {
  const [bazaars, setBazaars] = useState([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrModalTitle, setQrModalTitle] = useState("");
  const [formData, setFormData] = useState({
    bazaarName: "",
    startDate: "",
    endDate: "",
    RegDeadline: "",
    location: "",
    Description: "",
  });
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch bazaars
  useEffect(() => {
    const fetchBazaars = async () => {
      try {
        const res = await api.get("/");
        setBazaars(res.data);
      } catch (err) {
        console.error("Failed to load bazaars:", err);
      }
    };
    fetchBazaars();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editData) {
        res = await api.put(`/${editData._id}`, formData);
        setBazaars(prev =>
          Array.isArray(prev)
            ? prev.map(b => (b._id === editData._id ? res.data : b))
            : [res.data]
        );
      } else {
        res = await api.post("/", formData);
        setBazaars(prev =>
          Array.isArray(prev) ? [...prev, res.data] : [res.data]
        );
      }

      setEditData(null);
      setFormData({
        bazaarName: "",
        startDate: "",
        endDate: "",
        RegDeadline: "",
        location: "",
        Description: "",
      });
    } catch (err) {
      console.error("Error saving bazaar:", err.response?.data || err.message);
    }
  };

  // Filter active/upcoming and past bazaars
  const now = Date.now();
  const activeBazaars = Array.isArray(bazaars)
    ? bazaars.filter(b => new Date(b.endDate).getTime() >= now)
    : [];
  const pastBazaars = Array.isArray(bazaars)
    ? bazaars.filter(b => new Date(b.endDate).getTime() < now)
    : [];

  const getDaysUntil = (date) => {
    const diff = new Date(date).getTime() - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-purple-900 via-pink-800 to-rose-900 py-12 px-4">
      {/* Header with Return to Admin Button */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link 
          to="/admin"
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl backdrop-blur-xl border border-white/30 transition-all hover:scale-105"
        >
          ⬅️ Return to Admin
        </Link>
        
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 text-center"
        >
          🛍️ Bazaar Hub
        </motion.h1>
        
        {/* Export Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            try {
              setLoading(true);
              const response = await axios.get('http://localhost:4000/api/export/bazaars', {
                responseType: 'blob',
                withCredentials: true,
              });
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'bazaars_attendees.xlsx');
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
              setMessage("✅ Bazaar attendees exported successfully!");
              setTimeout(() => setMessage(""), 3000);
            } catch (err) {
              console.error('Export failed:', err);
              setMessage("❌ Failed to export bazaar attendees");
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
          Export Attendees
        </motion.button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mb-4 px-6 py-3 rounded-xl backdrop-blur-xl border max-w-4xl ${
            message.includes('✅') 
              ? 'bg-green-500/20 border-green-500/50 text-green-200' 
              : 'bg-red-500/20 border-red-500/50 text-red-200'
          }`}
        >
          {message}
        </motion.div>
      )}

      {/* Create Bazaar Form */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-2xl p-8 space-y-6 bg-gradient-to-br from-slate-800/60 to-pink-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-pink-500/20"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            name="bazaarName"
            placeholder="🏷️ Bazaar Name"
            value={formData.bazaarName}
            onChange={handleChange}
            required
            className="w-full px-5 py-4 text-white placeholder-pink-200 bg-black/40 rounded-xl border border-pink-500/20 focus:ring-2 focus:ring-pink-400 transition-all"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-pink-300 font-medium mb-2 block">📅 Start Date</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 text-white bg-black/40 rounded-xl border border-pink-500/20 focus:ring-2 focus:ring-pink-400 transition-all"
              />
            </div>
            <div>
              <label className="text-pink-300 font-medium mb-2 block">🏁 End Date</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 text-white bg-black/40 rounded-xl border border-pink-500/20 focus:ring-2 focus:ring-pink-400 transition-all"
              />
            </div>
            <div>
              <label className="text-pink-300 font-medium mb-2 block">📝 Registration Deadline</label>
              <input
                type="datetime-local"
                name="RegDeadline"
                value={formData.RegDeadline}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 text-white bg-black/40 rounded-xl border border-pink-500/20 focus:ring-2 focus:ring-pink-400 transition-all"
              />
            </div>
          </div>

          <input
            type="text"
            name="location"
            placeholder="📍 Location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full px-5 py-4 text-white placeholder-pink-200 bg-black/40 rounded-xl border border-pink-500/20 focus:ring-2 focus:ring-pink-400 transition-all"
          />
          <textarea
            name="Description"
            placeholder="📖 Bazaar description..."
            value={formData.Description}
            onChange={handleChange}
            rows="3"
            className="w-full px-5 py-4 text-white placeholder-pink-200 bg-black/40 rounded-xl border border-pink-500/20 focus:ring-2 focus:ring-pink-400 transition-all"
          />
          <button
            type="submit"
            className="w-full py-4 font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl shadow-2xl hover:shadow-pink-500/25"
          >
            🎪 {editData ? "Update Bazaar" : "Create Bazaar"}
          </button>
        </form>
      </motion.div>

     {/* Active / Upcoming Bazaars */}
<div className="w-full max-w-4xl mt-12">
  <h2 className="text-3xl font-bold text-white mb-6">Upcoming & Active Bazaars</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <AnimatePresence>
      {activeBazaars.length ? (
        activeBazaars.map((b) => (
          <motion.div
            key={b._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-black/40 rounded-2xl border border-pink-500/30 backdrop-blur-xl text-white hover:bg-black/60 transition-all"
          >
            <h3 className="text-xl font-bold mb-2">{b.bazaarName}</h3>
            <p className="text-pink-200 mb-1">{b.Description}</p>
            <p>📍 {b.location}</p>
            <p>
              📅 {new Date(b.startDate).toLocaleString()} -{" "}
              {new Date(b.endDate).toLocaleString()}
            </p>
            <p className="text-sm text-pink-300 mb-4">
              Days until end: {getDaysUntil(b.endDate)}
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Link
                to={`/bazaars/edit/${b._id}`}
                className="flex-1 py-2 px-4 bg-blue-500/60 hover:bg-blue-500/80 text-white font-semibold rounded-lg transition text-center"
              >
                ✏️ Edit
              </Link>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const res = await generateBazaarQR(b._id, {});
                    if (res.data?.qrDataUrl) {
                      setQrData(res.data);
                      setQrModalTitle(`${b.bazaarName} - Visitor QR`);
                      setQrModalOpen(true);
                    }
                  } catch (err) {
                    console.error('Failed to generate QR:', err);
                    alert('Failed to generate QR. Please try again.');
                  }
                }}
                className="flex-1 py-2 px-4 bg-green-500/60 hover:bg-green-500/80 text-white font-semibold rounded-lg transition flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR
              </button>
            </div>
          </motion.div>
        ))
      ) : (
        <p className="text-pink-300 col-span-full">
          No active/upcoming bazaars.
        </p>
      )}
    </AnimatePresence>
  </div>

  {/* Past Bazaars (unclickable) */}
  <h2 className="text-3xl font-bold text-white mt-12 mb-6">Past Bazaars</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <AnimatePresence>
      {pastBazaars.length ? (
        pastBazaars.map((b) => (
          <motion.div
            key={b._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-black/20 rounded-2xl border border-pink-500/20 backdrop-blur-xl text-white opacity-80 cursor-not-allowed"
          >
            <h3 className="text-xl font-bold mb-2">{b.bazaarName}</h3>
            <p className="text-pink-200 mb-1">{b.Description}</p>
            <p>📍 {b.location}</p>
            <p>
              📅 {new Date(b.startDate).toLocaleString()} -{" "}
              {new Date(b.endDate).toLocaleString()}
            </p>
            <p className="text-sm text-pink-300 italic">Event ended</p>
          </motion.div>
        ))
      ) : (
        <p className="text-pink-300 col-span-full">No past bazaars.</p>
      )}
    </AnimatePresence>
  </div>
</div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        qrData={qrData}
        title={qrModalTitle}
      />
    </div>
  );
}