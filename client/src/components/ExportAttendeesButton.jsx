export default function ExportAttendeesButton({ eventType, eventId }) {
  const handleExport = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to export.");
      return;
    }

    const url = `http://localhost:4000/api/export/${eventType}/${eventId}`;

    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Export failed");
        return response.blob();
      })
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `${eventType}-attendees-${eventId}.xlsx`;
        link.click();
      })
      .catch(() => alert("❌ Unable to export attendees"));
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center gap-2 shadow-lg text-sm"
    >
      📥 Export Excel
    </button>
  );
}
