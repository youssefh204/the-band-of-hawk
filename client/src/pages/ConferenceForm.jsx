import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../apis/axios";

function toInputDateTimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ConferenceForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    startDateTime: '',
    endDateTime: '',
    shortDescription: '',
    agenda: '',
    websiteLink: '',
    budget: '',
    fundingSource: 'GUC',
    resources: '',
    createdBy: '',
    allowedRoles: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) loadConference();
  }, [id]);

  async function loadConference() {
    try {
      setLoading(true);
      const res = await api.get(`http://localhost:4000/api/conferences/${id}`);
      const data = res.data.data;
      setForm({
        name: data.name || '',
        startDateTime: toInputDateTimeLocal(data.startDateTime),
        endDateTime: toInputDateTimeLocal(data.endDateTime),
        shortDescription: data.shortDescription || '',
        agenda: data.agenda || '',
        websiteLink: data.websiteLink || '',
        budget: data.budget ? String(data.budget) : '',
        fundingSource: data.fundingSource || 'GUC',
        resources: data.resources || '',
        createdBy: data.createdBy || '',
        allowedRoles: (data.allowedRoles || []).map(r => String(r).toLowerCase()),
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load conference");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleRole(role) {
    setForm(s => {
      const setRoles = new Set(s.allowedRoles || []);
      const r = String(role).toLowerCase();
      if (setRoles.has(r)) setRoles.delete(r); else setRoles.add(r);
      return { ...s, allowedRoles: Array.from(setRoles) };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: form.name,
      startDateTime: new Date(form.startDateTime).toISOString(),
      endDateTime: new Date(form.endDateTime).toISOString(),
      shortDescription: form.shortDescription,
      agenda: form.agenda,
      websiteLink: form.websiteLink,
      budget: form.budget ? Number(form.budget) : 0,
      fundingSource: form.fundingSource,
      resources: form.resources,
      createdBy: form.createdBy,
      allowedRoles: Array.isArray(form.allowedRoles) ? form.allowedRoles.map(r => String(r).toLowerCase()) : [],
    };

    try {
      if (id) {
        await api.put(`http://localhost:4000/api/conferences/${id}`, payload);
      } else {
        await api.post(`http://localhost:4000/api/conferences`, payload);
      }
      navigate("/conferences");
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-500 animate-gradient-x py-8">
      <div className="absolute top-6 left-6 right-6 flex justify-between">
        <Link to="/conferences" className="text-white font-semibold bg-blue-500/40 hover:bg-blue-500/70 px-4 py-2 rounded-lg shadow-md backdrop-blur-md transition">
          ← Back
        </Link>
        <Link to="/bazaars" className="text-white font-semibold bg-pink-500/40 hover:bg-pink-500/70 px-4 py-2 rounded-lg shadow-md backdrop-blur-md transition">
          Go to Bazaar
        </Link>
      </div>

      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-4xl font-extrabold text-center text-white mb-2">
            {id ? "Edit Conference" : "Create New Conference"}
          </h2>
          <p className="text-white/80 text-center mb-8">
            {id ? "Update conference details" : "Fill in the conference information below"}
          </p>

          {loading && <p className="text-center text-white">Loading...</p>}
          {error && <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6"><p className="text-red-200 text-center">{error}</p></div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">Conference Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20 focus:ring-2 focus:ring-pink-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Start Date & Time</label>
                <input type="datetime-local" name="startDateTime" value={form.startDateTime} onChange={handleChange} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20 focus:ring-2 focus:ring-pink-400" />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">End Date & Time</label>
                <input type="datetime-local" name="endDateTime" value={form.endDateTime} onChange={handleChange} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20 focus:ring-2 focus:ring-pink-400" />
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Short Description</label>
              <input name="shortDescription" value={form.shortDescription} onChange={handleChange} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20" />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Full Agenda</label>
              <textarea name="agenda" value={form.agenda} onChange={handleChange} rows={4} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20 resize-vertical" />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Conference Website</label>
              <input name="websiteLink" value={form.websiteLink} onChange={handleChange} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Required Budget (EGP)</label>
                <input type="number" name="budget" value={form.budget} onChange={handleChange} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20" />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Funding Source</label>
                <select name="fundingSource" value={form.fundingSource} onChange={handleChange} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20">
                  <option>GUC</option>
                  <option>external</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Extra Resources</label>
              <input name="resources" value={form.resources} onChange={handleChange} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20" />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Created By</label>
              <input name="createdBy" value={form.createdBy} onChange={handleChange} className="w-full px-4 py-3 text-white bg-white/10 rounded-xl border border-white/20" />
            </div>

            {/* Role Access Restriction */}
            <div>
              <label className="block text-white font-medium mb-2">
                Restrict Access (leave empty for public)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['student','staff','ta','professor','vendor','admin','eventoffice'].map(r => (
                  <label key={r} className="inline-flex items-center text-white/90 bg-white/5 px-3 py-2 rounded-lg hover:bg-white/10 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.allowedRoles || []).includes(r)}
                      onChange={() => toggleRole(r)}
                      className="mr-2 w-4 h-4 rounded border-white/20 focus:ring-2 focus:ring-pink-400"
                    />
                    <span className="font-medium">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                  </label>
                ))}
              </div>
              <p className="text-white/60 text-sm mt-2">✨ If one or more roles are selected, only users with those roles can view/register.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <button type="submit" disabled={loading} className="px-8 py-3 font-bold text-white bg-pink-500 rounded-xl hover:bg-pink-600 transition">
                {id ? "Save Changes" : "Create Conference"}
              </button>
              <button type="button" onClick={() => navigate("/conferences")} className="px-8 py-3 font-bold text-white bg-gray-500/50 rounded-xl hover:bg-gray-600/50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
