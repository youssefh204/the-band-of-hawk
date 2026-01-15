import { useState } from "react";
import { motion } from "framer-motion";
import apis from "../apis/axios";

export default function VendorRegister() {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apis.post("/auth/register-vendor", formData);
      setMessage(res.data.message || "Vendor registered successfully!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Vendor registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 animate-gradient-x">
      {/* Glowing background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl -top-20 left-10 animate-pulse" />
        <div className="absolute w-96 h-96 bg-red-500/20 rounded-full blur-3xl bottom-10 right-10 animate-ping" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10 p-10 bg-black/70 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-extrabold text-center text-white mb-6"
        >
          Vendor Registration
        </motion.h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {["companyName", "email", "password"].map((field, i) => (
            <motion.input
              key={field}
              type={field === "password" ? "password" : "text"}
              name={field}
              placeholder={
                field === "companyName"
                  ? "Company Name"
                  : field.charAt(0).toUpperCase() + field.slice(1)
              }
              value={formData[field]}
              onChange={handleChange}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 
              focus:ring-2 focus:ring-yellow-400 outline-none transition-all duration-200"
              required
            />
          ))}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 
            hover:from-orange-500 hover:to-yellow-400 text-black font-bold 
            rounded-xl shadow-lg transition-all duration-300"
          >
            {loading ? "Registering..." : "Register Vendor"}
          </motion.button>
        </form>

        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white mt-4"
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
