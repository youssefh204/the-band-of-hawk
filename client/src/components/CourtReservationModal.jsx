import { useEffect, useState } from "react";
import axios from "axios";
import { COURT_TIME_SLOTS } from "../constants/courtTimes";

const CourtReservationModal = ({ courtType, onClose }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [reservedSlots, setReservedSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReservedSlots = async (date) => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:4000/api/court-reservations/${courtType}/${date}`
      );
      setReservedSlots(res.data.data.map(res => res.timeSlot));
    } catch (err) {
      console.error("Failed to fetch reservations", err);
    } finally {
      setLoading(false);
    }
  };

  const reserveSlot = async (timeSlot) => {
    try {
      setLoading(true);
      await axios.post("http://localhost:4000/api/court-reservations", {
        courtType,
        date: selectedDate,
        timeSlot,
      }, { withCredentials: true });

      alert("Reservation successful!");
      fetchReservedSlots(selectedDate);
    } catch (err) {
      console.error("Reservation failed", err);
      alert(err.response?.data?.message || "Failed to reserve slot");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) fetchReservedSlots(selectedDate);
  }, [selectedDate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold mb-4 capitalize">{courtType} Court</h2>

        {/* Date Picker */}
        <input
          type="date"
          className="border rounded px-3 py-2 mb-4 w-full"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {COURT_TIME_SLOTS.map((slot) => {
              const taken = reservedSlots.includes(slot);
              return (
                <button
                  key={slot}
                  disabled={!selectedDate || taken}
                  onClick={() => reserveSlot(slot)}
                  className={`p-2 rounded border ${
                    taken
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {slot} {taken ? "⛔ Booked" : "✔ Available"}
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CourtReservationModal;
