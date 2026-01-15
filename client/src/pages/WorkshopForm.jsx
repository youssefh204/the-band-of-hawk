import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../apis/axios";

function toInputDateTimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function WorkshopForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    workshopName: '',
    location: 'GUC Cairo',
    startDateTime: '',
    endDateTime: '',
    shortDescription: '',
    fullAgenda: '',
    faculty: 'MET',
    professors: '',
    budget: '',
    fundingSource: 'GUC',
    extraResources: '',
    capacity: '',
    registrationDeadline: '',
    createdBy: '',
    allowedRoles: [],
    price: '0', // 🆕 ADD PRICE FIELD
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user role from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || user.userType || "student");
      } catch (err) {
        console.error("Error parsing user data:", err);
        setUserRole("student");
      }
    }

    if (id) {
      loadWorkshopForEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadWorkshopForEdit() {
    try {
      setLoading(true);
      setError(null);
      
      // Replace the current approach with a direct API call
      const res = await api.get(`http://localhost:4000/api/workshops/${id}`);
      
      // Use the response data directly
      const found = res.data.data;
      
      if (!found) {
        setError('Workshop not found for editing.');
        return;
      }
      
      setForm({
        workshopName: found.workshopName || '',
        location: found.location || 'GUC Cairo',
        startDateTime: toInputDateTimeLocal(found.startDateTime),
        endDateTime: toInputDateTimeLocal(found.endDateTime),
        shortDescription: found.shortDescription || '',
        fullAgenda: found.fullAgenda || '',
        faculty: found.faculty || 'MET',
        professors: (found.professors || []).join(', '),
        budget: found.budget != null ? String(found.budget) : '',
        fundingSource: found.fundingSource || 'GUC',
        extraResources: found.extraResources || '',
        capacity: found.capacity != null ? String(found.capacity) : '',
        registrationDeadline: toInputDateTimeLocal(found.registrationDeadline),
        createdBy: found.createdBy || '',
        allowedRoles: (found.allowedRoles || []).map(r => String(r).toLowerCase()),
        price: found.price != null ? String(found.price) : '0', // 🆕 ADD PRICE FIELD
      }); 
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function toggleRole(role) {
    setForm(s => {
      const setRoles = new Set(s.allowedRoles || []);
      const r = String(role).toLowerCase();
      if (setRoles.has(r)) setRoles.delete(r); else setRoles.add(r);
      return { ...s, allowedRoles: Array.from(setRoles) };
    });
  }

  function validate() {
    if (!form.workshopName.trim()) return 'Workshop name is required.';
    if (!form.startDateTime) return 'Start date/time is required.';
    if (!form.endDateTime) return 'End date/time is required.';
    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid start or end date.';
    if (end <= start) return 'End must be after start.';
    if (form.registrationDeadline) {
      const reg = new Date(form.registrationDeadline);
      if (isNaN(reg.getTime())) return 'Invalid registration deadline.';
    }
    // 🆕 ADD PRICE VALIDATION
    if (form.price === '' || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      return 'Price must be a valid number (0 or higher).';
    }
    return null;
  } 

  function getRedirectPath() {
    if (userRole?.toLowerCase() === 'admin') {
      return '/admin';
    }
    return '/home';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      startDateTime: new Date(form.startDateTime).toISOString(),
      endDateTime: new Date(form.endDateTime).toISOString(),
      registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null,
      professors: form.professors ? form.professors.split(',').map((s) => s.trim()).filter(Boolean) : [],
      budget: form.budget ? Number(form.budget) : 0,
      capacity: form.capacity ? Number(form.capacity) : 0,
      price: form.price ? Number(form.price) : 0, // 🆕 ADD PRICE TO PAYLOAD
      allowedRoles: Array.isArray(form.allowedRoles) ? form.allowedRoles.map(r => String(r).toLowerCase()) : [],
    };

    try {
      if (id) {
        // Use full URL for PUT
        await api.put(`http://localhost:4000/api/workshops/${id}`, payload);
        navigate(getRedirectPath());
      } else {
        // Use full URL for POST  
        await api.post('http://localhost:4000/api/workshops', payload);
        navigate(getRedirectPath());
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-500 animate-gradient-x py-8">
      {/* Navigation Links */}
      <div className="absolute top-6 left-6 right-6 flex justify-between">
        <Link
          to={getRedirectPath()}
          className="text-white font-semibold bg-blue-500/40 hover:bg-blue-500/70 px-4 py-2 rounded-lg shadow-md backdrop-blur-md transition"
        >
          ← Back to {userRole?.toLowerCase() === 'admin' ? 'Admin' : 'Home'}
        </Link>
        {/* Bazaar button removed */}
      </div>

      {/* Main Form */}
      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-4xl font-extrabold text-center text-white drop-shadow-lg mb-2">
              {id ? 'Edit Workshop' : 'Create New Workshop'}
            </h2>
            <p className="text-white/80 text-center mb-8">
              {id ? 'Update workshop details' : 'Fill in the workshop information below'}
              {userRole && (
                <span className="block text-sm mt-2 text-yellow-300">
                  Logged in as: {userRole}
                </span>
              )}
            </p>

            {loading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <p className="text-white mt-2">Loading...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
                <p className="text-red-200 text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workshop Name */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Workshop Name *
                </label>
                <input
                  name="workshopName"
                  value={form.workshopName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-white placeholder-white/70 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                  required
                />
              </div>

              {/* Location & Faculty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Location
                  </label>
                  <select
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                  >
                    <option>GUC Cairo</option>
                    <option>GUC Berlin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    Faculty
                  </label>
                  <select
                    name="faculty"
                    value={form.faculty}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                  >
                    <option>MET</option>
                    <option>IET</option>
                    <option>SET</option>
                    <option>SCE</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDateTime"
                    value={form.startDateTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDateTime"
                    value={form.endDateTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                    required
                  />
                </div>
              </div>

              {/* Registration Deadline */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={form.registrationDeadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                />
              </div>

              {/* Description & Agenda */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Short Description
                </label>
                <input
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-white placeholder-white/70 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Full Agenda
                </label>
                <textarea
                  name="fullAgenda"
                  value={form.fullAgenda}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 text-white placeholder-white/70 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20 resize-vertical"
                />
              </div>

              {/* Professors */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Professors (comma separated)
                </label>
                <input
                  name="professors"
                  value={form.professors}
                  onChange={handleChange}
                  placeholder="Prof. A, Dr. B"
                  className="w-full px-4 py-3 text-white placeholder-white/70 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                />
              </div>

              {/* 🆕 UPDATED: Budget, Capacity & Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Budget
                  </label>
                  <input
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    type="number"
                    className="w-full px-4 py-3 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    Capacity
                  </label>
                  <input
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    type="number"
                    className="w-full px-4 py-3 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                  />
                </div>
                {/* 🆕 ADD PRICE FIELD */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0 for free"
                    className="w-full px-4 py-3 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                    required
                  />
                  <p className="text-white/60 text-sm mt-1">Enter 0 for free workshops</p>
                </div>
              </div>

              {/* Funding Source & Extra Resources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Funding Source
                  </label>
                  <select
                    name="fundingSource"
                    value={form.fundingSource}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                  >
                    <option>GUC</option>
                    <option>external</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    Extra Resources
                  </label>
                  <input
                    name="extraResources"
                    value={form.extraResources}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-white placeholder-white/70 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                  />
                </div>
              </div>


              {/* Access restriction */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Restrict Access (leave empty for public)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['student','staff','ta','professor','vendor','admin','eventoffice'].map(r => (
                    <label key={r} className="inline-flex items-center text-white/90">
                      <input
                        type="checkbox"
                        checked={(form.allowedRoles || []).includes(r)}
                        onChange={() => toggleRole(r)}
                        className="mr-2"
                      />
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </label>
                  ))}
                </div>
                <p className="text-white/60 text-sm mt-2">If one or more roles are selected, only users with those roles can view/register.</p>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 font-bold text-white bg-pink-500 rounded-xl hover:bg-pink-600 transition-transform transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {id ? 'Save Changes' : 'Create Workshop'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(getRedirectPath())}
                  className="px-8 py-3 font-bold text-white bg-gray-500/50 rounded-xl hover:bg-gray-600/50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}