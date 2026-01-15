import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext.jsx";
import api from "../apis/axios";

export default function SalesReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState(null);
      const [userId, setUserId] = useState(null);
    
  
  const [error, setError] = useState(null);
  const { user: authUser } = useAuth();
    useEffect(() => {
      // Get user role and ID from localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserRole(user.role || user.userType || "student");
          setUserId(user.id || user._id);
          console.log("User role:", user.role || user.userType);
          console.log("User ID:", user.id || user._id);
          
        } catch (err) {
          console.error("Error parsing user data:", err);
          setUserRole("student");
        }
      }
    }, []);

  const isAdmin = userRole?.toLowerCase() === "admin";

  // Filters
  const [eventType, setEventType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Add custom styles for date inputs
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .calendar-input::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
        opacity: 0;
      }
      .calendar-input:hover::-webkit-calendar-picker-indicator {
        opacity: 0.8;
      }
      input[type="date"]::-webkit-datetime-edit {
        color: white;
      }
      input[type="date"]::-webkit-datetime-edit-fields-wrapper {
        padding: 0;
      }
      input[type="date"]::-webkit-datetime-edit-text {
        color: rgba(255, 255, 255, 0.5);
        padding: 0 0.3em;
      }
      input[type="date"]::-webkit-datetime-edit-month-field {
        color: white;
      }
      input[type="date"]::-webkit-datetime-edit-day-field {
        color: white;
      }
      input[type="date"]::-webkit-datetime-edit-year-field {
        color: white;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (eventType !== 'all') params.append('eventType', eventType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
  if (sortOrder) params.append('sortOrder', sortOrder);

      const response = await api.get(`http://localhost:4000/api/sales-report?${params.toString()}`);
      setReportData(response.data.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchReport();
  };

  const handleResetFilters = () => {
    setEventType('all');
    setStartDate('');
    setEndDate('');
  setSortOrder('desc');
    setTimeout(() => fetchReport(), 100);
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'Workshop': return 'from-purple-500 to-pink-500';
      case 'Conference': return 'from-blue-500 to-indigo-500';
      case 'Trip': return 'from-cyan-500 to-teal-500';
      case 'Bazaar': return 'from-rose-500 to-orange-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'Workshop': return '🎓';
      case 'Conference': return '🎤';
      case 'Trip': return '✈️';
      case 'Bazaar': return '🛍️';
      default: return '📅';
    }
  };

  const formatCurrency = (amount = 0) => {
    try {
      return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
        maximumFractionDigits: 0
      }).format(amount || 0);
    } catch {
      return `${amount || 0} EGP`;
    }
  };

  const revenueCards = [
    { key: 'workshops', label: 'Workshops', gradient: 'from-purple-500/30 to-indigo-500/10', accent: 'text-purple-200' },
    { key: 'conferences', label: 'Conferences', gradient: 'from-blue-500/30 to-cyan-500/10', accent: 'text-blue-200' },
    { key: 'trips', label: 'Trips', gradient: 'from-cyan-500/30 to-teal-500/10', accent: 'text-cyan-200' },
    { key: 'bazaars', label: 'Bazaars', gradient: 'from-rose-500/30 to-orange-500/10', accent: 'text-rose-200' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8 px-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 bg-pink-500/10 rounded-full blur-3xl top-1/3 -right-40 animate-ping" />
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -bottom-20 left-1/3 animate-bounce" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
<Link
  to={isAdmin ? "/admin" : "/home"}
  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-xl border border-white/20 transition-all hover:scale-105 flex items-center gap-2"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
  Back
</Link>


          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-center"
          >
            📊 Sales Report
          </motion.h1>

          <div className="w-40"></div>
        </div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-black/50 to-purple-900/30 backdrop-blur-2xl rounded-3xl border border-purple-500/30 p-8 mb-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              Filter Reports
            </h2>
            <span className="text-white/40 text-sm">Customize your view</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Event Type - Enhanced Dropdown */}
            <div className="relative">
              <label className="block text-white/90 text-sm font-bold mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Event Type
              </label>
              <div className="relative">
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-5 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white rounded-2xl border-2 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-xl appearance-none cursor-pointer font-medium hover:border-purple-400/50 transition-all shadow-lg"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                  }}
                >
                  <option value="all" className="bg-gray-900">📊 All Events</option>
                  <option value="workshops" className="bg-gray-900">🎓 Workshops</option>
                  <option value="conferences" className="bg-gray-900">🎤 Conferences</option>
                  <option value="trips" className="bg-gray-900">✈️ Trips</option>
                  <option value="bazaars" className="bg-gray-900">🛍️ Bazaars</option>
                </select>
              </div>
            </div>

            {/* Start Date - Enhanced Calendar */}
            <div className="relative">
              <label className="block text-white/90 text-sm font-bold mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-5 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-white rounded-2xl border-2 border-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent backdrop-blur-xl font-medium hover:border-green-400/50 transition-all shadow-lg calendar-input"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* End Date - Enhanced Calendar */}
            <div className="relative">
              <label className="block text-white/90 text-sm font-bold mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-5 py-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white rounded-2xl border-2 border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-xl font-medium hover:border-blue-400/50 transition-all shadow-lg calendar-input"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

            {/* Sort by revenue (order) */}
            <div className="relative">
              <label className="block text-white/90 text-sm font-bold mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3 8 4-16 3 8h4" />
                </svg>
                Sort by revenue
              </label>
              <div className="mt-1">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 text-white rounded-2xl border-2 border-white/10 focus:outline-none"
                >
                  <option value="desc">Greatest to least</option>
                  <option value="asc">Least to greatest</option>
                </select>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApplyFilters}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold rounded-2xl transition-all shadow-2xl hover:shadow-purple-500/50 flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Apply Filters
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetFilters}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border-2 border-white/20 hover:border-white/40 transition-all backdrop-blur-xl flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset All
            </motion.button>
          </div>

          {/* Active Filters Display */}
          {(eventType !== 'all' || startDate || endDate) && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-white/60 text-sm mb-3">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {eventType !== 'all' && (
                  <span className="px-4 py-2 bg-purple-500/30 text-purple-200 rounded-full text-sm font-medium border border-purple-400/30 flex items-center gap-2">
                    {eventType === 'workshops' && '🎓'}
                    {eventType === 'conferences' && '🎤'}
                    {eventType === 'trips' && '✈️'}
                    {eventType === 'bazaars' && '🛍️'}
                    {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                  </span>
                )}
                {startDate && (
                  <span className="px-4 py-2 bg-green-500/30 text-green-200 rounded-full text-sm font-medium border border-green-400/30 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    From: {new Date(startDate).toLocaleDateString()}
                  </span>
                )}
                {endDate && (
                  <span className="px-4 py-2 bg-blue-500/30 text-blue-200 rounded-full text-sm font-medium border border-blue-400/30 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    To: {new Date(endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mb-8"
          >
            <p className="text-red-200 text-center">{error}</p>
          </motion.div>
        )}

        {/* Report Data */}
        {!loading && reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              {/* Total */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">Total Events</span>
                  <span className="text-3xl">📊</span>
                </div>
                <div className="text-4xl font-black text-white">{reportData.summary.totalEvents}</div>
                <div className="text-purple-300 text-sm mt-1">{reportData.summary.totalAttendees} attendees</div>
                <div className="text-emerald-300 text-xs mt-2 font-semibold uppercase tracking-wide">
                  {formatCurrency(reportData.summary.totalRevenue)} total revenue
                </div>
              </motion.div>

              {/* Total Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">Total Revenue</span>
                  <span className="text-3xl">💰</span>
                </div>
                <div className="text-3xl font-black text-white">{formatCurrency(reportData.summary.totalRevenue)}</div>
                <div className="text-green-300 text-sm mt-1">by all events</div>
              </motion.div>

              {/* Workshops */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">Workshops</span>
                  <span className="text-3xl">🎓</span>
                </div>
                <div className="text-4xl font-black text-white">{reportData.summary.workshops.count}</div>
                <div className="text-purple-300 text-sm mt-1">{reportData.summary.workshops.attendees} attendees</div>
                <div className="text-purple-200 text-xs mt-2 font-semibold">
                  {formatCurrency(reportData.summary.workshops.revenue)}
                </div>
              </motion.div>

              {/* Conferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">Conferences</span>
                  <span className="text-3xl">🎤</span>
                </div>
                <div className="text-4xl font-black text-white">{reportData.summary.conferences.count}</div>
                <div className="text-blue-300 text-sm mt-1">{reportData.summary.conferences.attendees} attendees</div>
                <div className="text-blue-200 text-xs mt-2 font-semibold">
                  {formatCurrency(reportData.summary.conferences.revenue)}
                </div>
              </motion.div>

              {/* Trips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">Trips</span>
                  <span className="text-3xl">✈️</span>
                </div>
                <div className="text-4xl font-black text-white">{reportData.summary.trips.count}</div>
                <div className="text-cyan-300 text-sm mt-1">{reportData.summary.trips.attendees} attendees</div>
                <div className="text-cyan-200 text-xs mt-2 font-semibold">
                  {formatCurrency(reportData.summary.trips.revenue)}
                </div>
              </motion.div>

              {/* Bazaars */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-rose-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm font-medium">Bazaars</span>
                  <span className="text-3xl">🛍️</span>
                </div>
                <div className="text-4xl font-black text-white">{reportData.summary.bazaars.count}</div>
                <div className="text-rose-300 text-sm mt-1">{reportData.summary.bazaars.attendees} attendees</div>
                <div className="text-rose-200 text-xs mt-2 font-semibold">
                  {formatCurrency(reportData.summary.bazaars.revenue)}
                </div>
              </motion.div>
            </div>

          {/* Revenue Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-black/60 to-purple-900/30 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 mb-8 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <span>💰 Revenue Overview</span>
                  <span className="text-sm font-semibold text-white/70 bg-white/10 px-3 py-1 rounded-full">
                    {formatCurrency(reportData.summary.totalRevenue)}
                  </span>
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  Aggregated gross revenue per event category across the selected period.
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs uppercase tracking-wide">Average revenue / event</p>
                <p className="text-xl font-bold text-white">
                  {reportData.summary.totalEvents
                    ? formatCurrency(Math.round(reportData.summary.totalRevenue / reportData.summary.totalEvents))
                    : formatCurrency(0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {revenueCards.map((card, idx) => {
                const stats = reportData.summary[card.key] || { revenue: 0, count: 0, attendees: 0 };
                const share = reportData.summary.totalRevenue
                  ? Math.round((stats.revenue / reportData.summary.totalRevenue) * 100)
                  : 0;

                return (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className={`bg-gradient-to-br ${card.gradient} border border-white/10 rounded-2xl p-5`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/70 text-sm font-semibold">{card.label}</p>
                      <span className="text-white/80 text-xs bg-white/10 rounded-full px-3 py-1">
                        {stats.count || 0} events
                      </span>
                    </div>
                    <p className={`text-3xl font-black ${card.accent}`}>{formatCurrency(stats.revenue)}</p>
                    <p className="text-white/60 text-xs mt-1">
                      {stats.attendees || 0} attendees • avg{' '}
                      {stats.count ? formatCurrency(Math.round((stats.revenue || 0) / stats.count)) : formatCurrency(0)}
                    </p>
                    <div className="mt-4">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/70"
                          style={{ width: `${share}%` }}
                        ></div>
                      </div>
                      <p className="text-white/60 text-xs mt-2">{share}% of total revenue</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

            {/* Events List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Event Details</h2>

              {reportData.events.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">📭</span>
                  <p className="text-white/60 text-lg">No events found matching your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportData.events.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-white/5 hover:bg-white/10 rounded-xl p-5 border border-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getEventTypeColor(event.type)} flex items-center justify-center text-2xl shadow-lg`}>
                            {getEventTypeIcon(event.type)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">{event.name}</h3>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getEventTypeColor(event.type)} text-white`}>
                                {event.type}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-white/50">Date:</span>
                                <p className="text-white/90 font-medium">
                                  {new Date(event.date).toLocaleDateString()}
                                </p>
                              </div>

                              {event.location && (
                                <div>
                                  <span className="text-white/50">Location:</span>
                                  <p className="text-white/90 font-medium">{event.location}</p>
                                </div>
                              )}

                              {event.destination && (
                                <div>
                                  <span className="text-white/50">Destination:</span>
                                  <p className="text-white/90 font-medium">{event.destination}</p>
                                </div>
                              )}

                              {event.faculty && (
                                <div>
                                  <span className="text-white/50">Faculty:</span>
                                  <p className="text-white/90 font-medium">{event.faculty}</p>
                                </div>
                              )}

                              {(event.price || event.price === 0) && (
                                <div>
                                  <span className="text-white/50">Price:</span>
                                  <p className="text-white/90 font-medium">{formatCurrency(event.price)}</p>
                                </div>
                              )}
                              {(event.revenue || event.revenue === 0) && (
                                <div>
                                  <span className="text-white/50">Revenue:</span>
                                  <p className="text-white/90 font-medium">{formatCurrency(event.revenue)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Attendees Badge */}
                        <div className="text-right">
                          <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10">
                            <div className="text-3xl font-black text-white">{event.attendees}</div>
                            <div className="text-white/60 text-xs">
                              {event.capacity ? `of ${event.capacity}` : 'attendees'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
