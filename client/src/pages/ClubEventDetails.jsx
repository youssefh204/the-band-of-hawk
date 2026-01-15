import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClubEventAPI from "../apis/ClubEventAPI";

export default function ClubEventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const load = async () => {
    try {
      const res = await ClubEventAPI.getEventById(id);
      setEvent(res.data.event);
    } catch (e) {
      console.log(e);
      alert("Failed to load event");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (status) => {
    try {
      await ClubEventAPI.updateStatus(id, { status });
      load();
      alert("Updated!");
    } catch (e) {
      alert("Failed");
    }
  };

  if (!event) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-6">

      {/* 🔙 BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
      >
        ← Back
      </button>

      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow border">

        <h1 className="text-3xl font-bold">{event.eventName}</h1>

        <p className="text-gray-600 mt-3">{event.Description}</p>

        <p className="mt-4 text-lg">
          📅 <b>{new Date(event.eventDate).toLocaleDateString()}</b>
        </p>

        <p className="mt-4 font-semibold">
          Status: <span className="uppercase">{event.status}</span>
        </p>

        {isAdmin && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => updateStatus("accepted")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Accept
            </button>
            <button
              onClick={() => updateStatus("declined")}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
