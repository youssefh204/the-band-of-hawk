import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../apis/bazaarClient.js";
import { generateBazaarQR } from "../apis/bazaarClient.js";
import { motion } from "framer-motion";
import QRCodeModal from "../components/QRCodeModal";

export default function BazaarEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [formData, setFormData] = useState({
    bazaarName: "",
    startDate: "",
    endDate: "",
    RegDeadline: "",
    location: "",
    Description: "",
  });

  // ✅ Format ISO date to "YYYY-MM-DDTHH:MM"
  const formatDateForInput = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    const fetchBazaar = async () => {
      try {
        const res = await api.get(`/${id}`);
        const b = res.data;

        setFormData({
          bazaarName: b.bazaarName || "",
          startDate: formatDateForInput(b.startDate),
          endDate: formatDateForInput(b.endDate),
          RegDeadline: formatDateForInput(b.RegDeadline),
          location: b.location || "",
          Description: b.Description || "",
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching bazaar:", err.response?.data || err.message);
        setLoading(false);
      }
    };
    fetchBazaar();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/${id}`, formData);
      navigate("/bazaars"); // ✅ go back to bazaars page
    } catch (err) {
      console.error("Error updating bazaar:", err.response?.data || err.message);
    }
  };

  const handleGenerateQR = async () => {
    try {
      const res = await generateBazaarQR(id, {});
      if (res.data && res.data.qrDataUrl) {
        setQrData(res.data);
        setQrModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to generate QR:', err.response?.data || err.message);
      alert('Failed to generate QR. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-2xl">
        Loading Bazaar Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-purple-900 via-pink-800 to-rose-900 py-12 px-4">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-8 text-center"
      >
        ✏️ Edit Bazaar
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-8 space-y-6 bg-gradient-to-br from-slate-800/60 to-pink-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-pink-500/20"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Bazaar Name */}
          <input
            type="text"
            name="bazaarName"
            placeholder="🏷️ Bazaar Name"
            value={formData.bazaarName}
            onChange={handleChange}
            required
            className="w-full px-5 py-4 text-white placeholder-pink-200 bg-black/40 rounded-xl border border-pink-500/20 focus:ring-2 focus:ring-pink-400 transition-all"
          />

          {/* Dates */}
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

          {/* Location & Description */}
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
            rows="4"
            className="w-full px-5 py-4 text-white placeholder-pink-200 bg-black/40 rounded-xl border border-pink-500/20 focus:ring-2 focus:ring-pink-400 transition-all"
          />

          {/* Save Button */}
          <button
            type="submit"
            onClick={() => navigate("/bazaars")}
            className="w-full py-4 font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-xl shadow-2xl hover:shadow-pink-500/25"
          >
            💾 Save Changes
          </button>
          <button
            type="button"
            onClick={handleGenerateQR}
            className="w-full mt-3 py-3 font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl shadow-2xl transition-transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Generate Visitor QR Code
          </button>
        </form>
      </motion.div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        qrData={qrData}
        title={`${formData.bazaarName || 'Bazaar'} - Visitor QR Code`}
      />
    </div>
  );
}
