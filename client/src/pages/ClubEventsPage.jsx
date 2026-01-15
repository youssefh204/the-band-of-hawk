import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClubEventAPI from "../apis/ClubEventAPI";
import ClubAPI from "../apis/ClubAPI";

export default function ClubEventsPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingClubs, setLoadingClubs] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventName: "",
    Description: "",
    eventDate: "",
    clubId: ""
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isStudent = user?.role?.toLowerCase() === "student";

  // -----------------------------
  // LOAD EVENTS
  // -----------------------------
  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await ClubEventAPI.getEvents();
      console.log("EVENTS RESPONSE:", res.data);
      setEvents(res.data.events || res.data || []);
    } finally {
      setLoadingEvents(false);
    }
  };

  // -----------------------------
  // LOAD CLUBS (THE IMPORTANT PART)
  // -----------------------------
  const loadClubs = async () => {
    try {
      setLoadingClubs(true);

      const res = await ClubAPI.getClubs?.() || await ClubAPI.getAllClubs?.();
      console.log("CLUBS RESPONSE RAW:", res?.data);

      // normalize backend responses regardless of structure
      const data = res?.data;

      const extracted =
        data?.clubs ||
        data?.data ||
        data?.allClubs ||
        (Array.isArray(data) ? data : []) ||
        [];

      console.log("CLUBS EXTRACTED:", extracted);

      setClubs(Array.isArray(extracted) ? extracted : []);
    } catch (err) {
      console.error("FAILED TO LOAD CLUBS:", err);
      setClubs([]);
    } finally {
      setLoadingClubs(false);
    }
  };

  useEffect(() => {
    loadEvents();
    loadClubs(); // <--- THIS MUST RUN
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await ClubEventAPI.createEvent(newEvent);
      setShowCreate(false);
      setNewEvent({ eventName: "", Description: "", eventDate: "", clubId: "" });
      loadEvents();
      alert("Event Submitted (Pending Approval)");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create event");
    }
  };

  if (loadingEvents || loadingClubs)
    return <div className="text-center text-lg py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-orange-200 mb-6">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold text-gray-800">🎉 Club Events</h1>

          {(isAdmin || isStudent) && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
            >
              + Create Event
            </button>
            
          )}
        </div>
      </div>
      {/* 🔙 BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
      >
        ← Back
      </button>

      {/* EVENT CARDS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((ev) => (
          <div key={ev._id} className="bg-white rounded-xl p-5 border shadow">
            <h2 className="text-xl font-bold">{ev.eventName}</h2>
            <p className="text-gray-600 mt-2">{ev.Description}</p>
            <p className="mt-3 text-sm text-gray-500">
              📅 {new Date(ev.eventDate).toLocaleDateString()}
            </p>

            <p
              className={`mt-3 font-semibold ${
                ev.status === "accepted"
                  ? "text-green-600"
                  : ev.status === "declined"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              Status: {ev.status.toUpperCase()}
            </p>

            <button
              onClick={() => navigate(`/club-events/${ev._id}`)}
              className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create Event</h2>

            <form className="space-y-4" onSubmit={handleCreate}>
              <input
                type="text"
                placeholder="Event Name"
                className="w-full p-3 border rounded-lg"
                value={newEvent.eventName}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, eventName: e.target.value })
                }
                required
              />

              <textarea
                className="w-full p-3 border rounded-lg"
                placeholder="Description"
                value={newEvent.Description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, Description: e.target.value })
                }
              />

              <input
                type="date"
                className="w-full p-3 border rounded-lg"
                value={newEvent.eventDate}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, eventDate: e.target.value })
                }
                required
              />

              {/* 🔥 FIXED DROPDOWN WITH CLUBS */}
              <select
                className="w-full p-3 border rounded-lg"
                value={newEvent.clubId}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, clubId: e.target.value })
                }
                required
              >
                <option value="">Select Club</option>

                {clubs.map((club) => (
                  <option key={club._id} value={club._id}>
                    {club.clubName}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg"
                >
                  Submit Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
