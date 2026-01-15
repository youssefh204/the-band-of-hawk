import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import apis from "../apis/axios";

export default function Register() {
  const [formData, setFormData] = useState({
    role: "student",
    firstName: "",
    lastName: "",
    studentId: "",
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
      const payload =
        formData.role === "vendor"
          ? {
              role: formData.role,
              companyName: formData.companyName,
              email: formData.email,
              password: formData.password,
            }
          : {
              role: formData.role,
              firstName: formData.firstName,
              lastName: formData.lastName,
              studentId: formData.studentId,
              email: formData.email,
              password: formData.password,
            };

      const res = await apis.post("/register", payload);
      setMessage(res.data.message || "Registration successful!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-700 animate-gradient-x">
      <div
        className="absolute inset-0 bg-cover bg-center blur-lg"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1454817481404-7e84c1b73b4a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        }}
      ></div>

      <div className="absolute inset-0 bg-black/50"></div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-10 right-10 animate-ping" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10 p-10 bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-extrabold text-center text-white mb-6"
        >
          Account Registration
        </motion.h2>

        {/* Role Selector */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-2 text-sm font-medium">
            Choose your role
          </label>
          <div className="relative group">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-blue-500/20 
              text-white font-medium appearance-none cursor-pointer border border-white/30 
              focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-300"
            >
              <option value="student" className="bg-gray-900 text-white">
                Student
              </option>
              <option value="ta" className="bg-gray-900 text-white">
                Teaching Assistant
              </option>
              <option value="professor" className="bg-gray-900 text-white">
                Professor
              </option>
              <option value="staff" className="bg-gray-900 text-white">
                Staff
              </option>
              <option value="vendor" className="bg-gray-900 text-white">
                Vendor
              </option>
            </select>

            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 group-hover:text-white transition-all duration-300">
              ▼
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formData.role === "vendor" ? (
            <motion.input
              key="companyName"
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={handleChange}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 
              focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-200"
              required
            />
          ) : (
            <>
              <motion.input
                key="firstName"
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 
                focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-200"
                required
              />
              <motion.input
                key="lastName"
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 
                focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-200"
                required
              />
              <motion.input
                key="studentId"
                type="text"
                name="studentId"
                placeholder={
                  formData.role === "student"
                    ? "Student ID"
                    : formData.role === "ta"
                    ? "TA ID (optional)"
                    : formData.role === "professor"
                    ? "Professor ID (optional)"
                    : "Staff ID (optional)"
                }
                value={formData.studentId}
                onChange={handleChange}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 
                focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-200"
              />
            </>
          )}

          {/* Shared Fields */}
          <motion.input
            key="email"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 
            focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-200"
            required
          />

          <motion.input
            key="password"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 
            focus:ring-2 focus:ring-indigo-400 outline-none transition-all duration-200"
            required
          />

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 
            hover:from-purple-500 hover:to-indigo-500 text-white font-bold 
            rounded-xl shadow-lg transition-all duration-300"
          >
            {loading ? "Registering..." : "Register"}
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

        <div className="flex justify-center items-center gap-2 mt-6">
          <span className="text-white/80">Already have an account?</span>
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
          >
            Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
