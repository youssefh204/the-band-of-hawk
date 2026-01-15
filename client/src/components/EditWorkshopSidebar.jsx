import { useState } from "react";
import api from "../apis/workshopClient";

export default function EditWorkshopSidebar({ workshop, onClose, onUpdated }) {
  const [name, setName] = useState(workshop.workshopName);
  const [location, setLocation] = useState(workshop.location);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    try {
      setLoading(true);
      await api.put(`/workshops/${workshop._id}`, {
        workshopName: name,
        location
      });
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-gray-900 text-white p-6 shadow-2xl z-50 animate-slide-left">
      <h2 className="text-2xl font-bold mb-4">Edit Workshop</h2>

      <label className="block mb-2">Workshop Name</label>
      <input
        className="w-full p-2 rounded bg-gray-700"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <label className="block mt-4 mb-2">Location</label>
      <input
        className="w-full p-2 rounded bg-gray-700"
        value={location}
        onChange={e => setLocation(e.target.value)}
      />

      <div className="flex justify-between mt-6">
        <button
          className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
