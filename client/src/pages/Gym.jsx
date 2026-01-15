import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gymAPI from "../apis/gymClient";

export default function Gym() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [gymSessions, setGymSessions] = useState([]);
  const [newSession, setNewSession] = useState({
    date: "",
    time: "",
    duration: "",
    type: "",
    maxParticipants: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const gymTypes = [
    "Yoga", "Pilates", "Aerobics",
    "Zumba", "Cross Circuit", "Kick-boxing"
  ];

  // Load user info
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || "student");
      } catch {
        setUserRole("student");
      }
    } else {
      setUserRole("student");
    }
  }, []);

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await gymAPI.getSessions();

      const sessions = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setGymSessions(sessions);
    } catch (err) {
      console.error(err);
      setError("Failed to load gym sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewSession({ ...newSession, [name]: value });
  };

  // Create session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await gymAPI.createSession(newSession);
      setNewSession({ date: "", time: "", duration: "", type: "", maxParticipants: "" });
      fetchSessions();
      alert("Session created successfully!");
    } catch {
      alert("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  if (!userRole) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Loading user...
      </div>
    );
  }

  const isEventOffice = userRole.toLowerCase() === "eventoffice";

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <button
        onClick={() => navigate(-1)}
        className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-8 text-center">Gym Sessions</h1>

      {isEventOffice && (
        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mb-10 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Create New Session</h2>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateSession}>
            <input type="date" name="date" value={newSession.date} onChange={handleChange}
              required className="p-3 rounded-lg bg-gray-700 text-white" />

            <input type="time" name="time" value={newSession.time} onChange={handleChange}
              required className="p-3 rounded-lg bg-gray-700 text-white" />

            <input type="text" name="duration" placeholder="Duration (mins)" value={newSession.duration}
              onChange={handleChange} required className="p-3 rounded-lg bg-gray-700 text-white" />

            <select name="type" value={newSession.type} onChange={handleChange}
              required className="p-3 rounded-lg bg-gray-700 text-white">
              <option value="">Select Type</option>
              {gymTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <input type="number" name="maxParticipants" placeholder="Max Participants"
              value={newSession.maxParticipants} onChange={handleChange}
              required className="p-3 rounded-lg bg-gray-700 text-white" />

            <button
              type="submit"
              disabled={loading}
              className="col-span-1 md:col-span-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg"
            >
              {loading ? "Creating..." : "Create Session"}
            </button>
          </form>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Schedule</h2>

      {loading ? (
        <p className="text-gray-400 text-center">Loading sessions...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gymSessions.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center">No sessions yet</p>
          ) : gymSessions.map((session) => (
            <div key={session._id} className="bg-gray-900 p-5 rounded-xl border border-gray-700 shadow-lg">
              <h3 className="text-xl font-bold mb-2 capitalize">{session.type}</h3>

              <p className="text-gray-300">📅 {session.date}</p>
              <p className="text-gray-300">🕒 {session.time}</p>
              <p className="text-gray-300">⏱ {session.duration} mins</p>
              <p className="text-gray-300">
                👥 {session.currentParticipants} / {session.maxParticipants}
              </p>
              <p className={`mt-1 text-sm font-semibold ${
                session.status === "active" ? "text-green-400" : "text-red-400"
              }`}>
                {session.status.toUpperCase()}
              </p>

              {userRole === "student" && session.status === "active" && (
                <button
                  onClick={async () => {
                    try {
                      await gymAPI.joinSession(session._id);
                      fetchSessions();
                      alert("Joined successfully!");
                    } catch (e) {
                      alert(e.response?.data?.message || "Failed to join");
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg mt-4"
                >
                  Join
                </button>
              )}

              {isEventOffice && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this session?")) return;
                      await gymAPI.deleteSession(session._id);
                      fetchSessions();
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
