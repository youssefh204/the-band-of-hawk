import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../components/AuthContext";

export default function CourtList() {
  const [courts, setCourts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const timeSlots = ["10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", "14:00 - 15:00"];

  const { user } = useAuth();

  useEffect(() => {
    axios.get("http://localhost:4000/api/courts", { withCredentials: true })
      .then(res => setCourts(res.data.data))
      .catch(console.error);
  }, []);

  const loadSchedule = (id) => {
    setSelected(id);
    axios.get(`http://localhost:4000/api/courts/${id}/schedule`, { withCredentials: true })
      .then(res => setSchedule(res.data.data))
      .catch(console.error);
  };

  const reserve = async (courtId, slot) => {
    const today = new Date().toISOString().split("T")[0];
    try {
      await axios.post(`http://localhost:4000/api/courts/${courtId}/reserve`, {
        date: today,
        timeSlot: slot,
      }, { withCredentials: true });

      alert("Reserved Successfully!");
      loadSchedule(courtId);
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="text-white space-y-6">
      {courts.map(court => (
        <div key={court._id} className="bg-white/20 p-4 rounded-xl">
          <h3 className="text-xl font-bold">{court.name} 🏟</h3>
          <p className="opacity-80 capitalize">{court.sport}</p>

          <button
            onClick={() => loadSchedule(court._id)}
            className="mt-3 bg-blue-500 px-4 py-2 rounded-lg"
          >
            View Availability
          </button>

          {/* Schedule UI */}
          {selected === court._id && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {timeSlots.map(slot => {
                const booked = schedule.some(
                  r => r.timeSlot === slot
                );
                return (
                  <button
                    key={slot}
                    disabled={booked}
                    className={`p-3 rounded-lg ${booked ? "bg-red-500/60 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                    onClick={() => reserve(court._id, slot)}
                  >
                    {slot} {booked ? "⛔" : "✔"}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
