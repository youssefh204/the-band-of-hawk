import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await axios.post(
      "http://localhost:4000/api/auth/login",
      { email, password },
      { withCredentials: true }
    );

    if (!res.data.success) {
      throw new Error(res.data.message || "Login failed");
    }

    const { user, token } = res.data;

    // Store token and user data locally and set header for future requests
    try {
      if (token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to persist token:', e);
    }

    // Store user data
    localStorage.setItem('user', JSON.stringify(user));
    
    // Show welcome message
    const welcomeName = user.accountType === 'vendor' 
      ? user.companyName 
      : `${user.firstName} ${user.lastName}`;
    
    console.log(`✅ Welcome, ${welcomeName}!`);

    // Redirect logic
    let redirectPath = "/home"; // default
    
    switch (user.role) {
      case "Admin":
        redirectPath = "/admin";
        break;
      case "vendor":
        redirectPath = user.isApproved ? "/vendor-dashboard" : "/vendor-pending";
        break;
      case "staff":
      case "professor":
      case "ta":
        redirectPath = "/home";
        break;
      default: // student
        redirectPath = "/home";
    }

    navigate(redirectPath);

  } catch (err) {
    console.error("❌ Login failed:", err.response?.data || err.message);
    
    // More specific error messages
    const errorMessage = err.response?.data?.message || 
                        err.message || 
                        "Login failed. Please try again.";
    
    alert(errorMessage);
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

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-10 right-10 animate-ping" />
      </div>
      <div className="w-full max-w-md p-10 bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
        <h2 className="text-4xl font-extrabold text-center text-white mb-6">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-white focus:ring-2 focus:ring-pink-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-white focus:ring-2 focus:ring-pink-400"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-bold rounded-xl ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-pink-400 hover:bg-pink-500"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="flex justify-center gap-2 mt-4">
            <span className="text-white/80">Don’t have an account?</span>
            <Link to="/register" className="text-pink-400 hover:text-pink-300">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
