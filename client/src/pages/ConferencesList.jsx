import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../apis/axios";
import { generateConferenceQR } from "../apis/conferenceClient";
import QRCodeModal from "../components/QRCodeModal";

export default function ConferencesList() {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrModalTitle, setQrModalTitle] = useState("");

  useEffect(() => {
    fetchConferences();
  }, []);

  async function fetchConferences() {
    try {
      setLoading(true);
      const res = await api.get("http://localhost:4000/api/conferences");
      setConferences(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch conferences");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(conferenceId) {
    if (!window.confirm("Are you sure you want to delete this conference? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(conferenceId);
      setError(null);
      await api.delete(`http://localhost:4000/api/conferences/${conferenceId}`);
      setConferences((prev) => prev.filter((c) => c._id !== conferenceId));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete conference";
      setError(errorMessage);
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-500 animate-gradient-x py-8">
      <div className="absolute top-6 left-6">
        <Link
          to="/home"
          className="text-white font-semibold bg-gray-500/40 hover:bg-gray-500/70 px-4 py-2 rounded-lg shadow-md backdrop-blur-md transition"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 mb-6">
            <h2 className="text-4xl font-extrabold text-center text-white mb-2">
              Conferences
            </h2>
            <p className="text-white/80 text-center mb-6">
              Manage and view upcoming conferences
            </p>

            <div className="flex justify-center mb-6">
              <Link
                to="/conferences/new"
                className="px-6 py-3 font-bold text-white bg-pink-500 rounded-xl hover:bg-pink-600 transition-transform transform hover:scale-105 shadow-lg"
              >
                Create New Conference
              </Link>
            </div>
          </div>

          {loading && <p className="text-center text-white">Loading conferences...</p>}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
              <p className="text-red-200 text-center">{error}</p>
              <p className="text-red-200 text-center text-sm mt-2">
                Please check if the backend server is running and the API endpoint exists.
              </p>
            </div>
          )}

          {!loading && conferences.length === 0 && !error && (
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20">
              <p className="text-white/80 text-xl">No conferences found.</p>
            </div>
          )}

          <div className="space-y-4">
            {conferences.map((c) => (
              <div
                key={c._id}
                className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{c.name}</h3>

                    <div className="text-white/70 text-sm mb-2">
                      🗓️ {new Date(c.startDateTime).toLocaleString()} –{" "}
                      {new Date(c.endDateTime).toLocaleString()}
                    </div>

                    <p className="text-white/80 mb-3">{c.shortDescription}</p>

                    <div className="text-white/60 text-xs space-x-2">
                      <span className="bg-purple-500/30 px-2 py-1 rounded">
                        💰 {c.budget} EGP
                      </span>
                      <span className="bg-pink-500/30 px-2 py-1 rounded">
                        👤 {c.createdBy || "Unknown"}
                      </span>
                      <span className="bg-blue-500/30 px-2 py-1 rounded">
                        💼 {c.fundingSource}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/conferences/${c._id}/edit`}
                      className="px-4 py-2 text-white bg-blue-500/60 hover:bg-blue-500/80 rounded-lg transition backdrop-blur-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={async () => {
                        try {
                          const res = await generateConferenceQR(c._id, {});
                          if (res.data?.qrDataUrl) {
                            setQrData(res.data);
                            setQrModalTitle(`${c.name} - Visitor QR`);
                            setQrModalOpen(true);
                          }
                        } catch (err) {
                          console.error('Failed to generate QR:', err);
                          alert('Failed to generate QR. Please try again.');
                        }
                      }}
                      className="px-4 py-2 text-white bg-green-500/60 hover:bg-green-500/80 rounded-lg transition backdrop-blur-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      QR Code
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      disabled={deletingId === c._id}
                      className="px-4 py-2 text-white bg-red-500/60 hover:bg-red-500/80 disabled:bg-red-500/30 rounded-lg transition backdrop-blur-sm disabled:cursor-not-allowed"
                    >
                      {deletingId === c._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        qrData={qrData}
        title={qrModalTitle}
      />
    </div>
  );
}