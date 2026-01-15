// src/pages/PollsPage.jsx
import { useEffect, useState } from "react";
import api from "../apis/workshopClient";
import { useAuth } from "../components/AuthContext";
import { Link } from "react-router-dom";

export default function PollsPage() {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();
  const isEventOffice = ["eventoffice", "admin"].includes(userRole);

  const [polls, setPolls] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [title, setTitle] = useState("");

  const fetchData = async () => {
    try {
      const pollsRes = await api.get("/polls");
      setPolls(pollsRes.data.data || []);

      if (isEventOffice) {
        const vendorsRes = await api.get("/vendor/all");
        setVendors(vendorsRes.data.data || []);
      }
    } catch (e) {
      console.error("Load failed:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const voteVendor = async (pollId, vendorId) => {
    try {
      await api.post("/polls/vote", { pollId, vendorId });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to vote");
    }
  };

  const createPoll = async () => {
    if (!title || selectedVendors.length < 2)
      return alert("Pick at least 2 vendors and add a title!");

    try {
      await api.post("/polls", {
        title,
        vendorIds: selectedVendors,
      });

      alert("Poll Created!");
      setTitle("");
      setSelectedVendors([]);
      fetchData();
    } catch (err) {
      alert("Failed creating poll");
    }
  };

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-[#4E21E7] via-[#C135FC] to-[#FF5F8F] text-white flex flex-col items-center gap-10">

      {/* Navigation */}
      <Link 
        to="/home" 
        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition backdrop-blur-md border border-white/30 shadow-md font-medium"
      >
        ⬅ Back to Home
      </Link>

      {/* Title */}
      <h1 className="text-5xl font-extrabold text-center drop-shadow-2xl tracking-wide">
        🎪 Vendor Booth Polls
      </h1>

      {/* Create Poll (Admin / Event Office Only) */}
      {isEventOffice && (
        <div className="bg-white/20 p-8 rounded-2xl w-full max-w-3xl shadow-2xl backdrop-blur-xl border border-white/30">
          <h2 className="text-3xl font-bold mb-6">🗳️ Create a New Poll</h2>

          <input
            type="text"
            placeholder="Poll Title"
            className="w-full mb-4 p-3 rounded-lg text-black focus:ring-4 ring-yellow-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

{/* Vendor Selection as Clickable Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
  {vendors.map((v) => {
    const isSelected = selectedVendors.includes(v._id);

    return (
      <div
        key={v._id}
        onClick={() => {
          setSelectedVendors((prev) =>
            prev.includes(v._id)
              ? prev.filter((id) => id !== v._id)
              : [...prev, v._id]
          );
        }}
        className={`cursor-pointer px-4 py-3 rounded-xl transition border ${
          isSelected
            ? "border-yellow-400 bg-yellow-400 text-black font-bold scale-[1.05]"
            : "border-white/40 bg-white/10 hover:bg-white/20"
        }`}
      >
        <p className="text-lg">
          {v.companyName || "Unnamed Vendor"}
        </p>
      </div>
    );
  })}
</div>

<p className="text-sm opacity-90 mt-2">
  ✔ Click vendors to select (minimum 2)
</p>

          <button
            onClick={createPoll}
            className="w-full mt-6 py-3 bg-yellow-400 hover:bg-yellow-500 transition text-black font-bold rounded-xl"
          >
            ➕ Create Poll
          </button>
        </div>
      )}

      {/* Poll Cards */}
      <div className="w-full max-w-4xl grid gap-8">
        {polls.length === 0 && (
          <p className="text-center text-lg font-medium opacity-90">
            🚫 No active polls yet.
          </p>
        )}

        {polls.map((poll) => {
          const userVoted = poll.voters.includes(user?.id);

          return (
            <div key={poll._id} className="bg-white/15 p-8 rounded-3xl shadow-xl backdrop-blur-md border border-white/25 hover:scale-[1.02] transition">
              <h3 className="text-3xl font-extrabold mb-5">{poll.title}</h3>

              {poll.isResolved ? (
                <p className="bg-green-400 bg-opacity-90 px-5 py-3 rounded-lg text-black font-bold text-xl text-center">
                  🏆 Winner: {poll.winningVendor?.companyName || "Unknown"}
                </p>
              ) : (
                poll.vendors
                  .filter(v => v.vendorId) // remove null vendorIds
                  .map((v) => (
                    <div key={v.vendorId._id} className="flex justify-between items-center bg-white/10 p-4 rounded-xl mt-3 backdrop-blur">
                     <span className="font-medium text-lg flex items-center gap-3">
  {v.vendorId.companyName}
  <span className="px-2 py-1 text-sm bg-black/30 rounded-lg">
    {Array.isArray(v.votes) ? v.votes.length : 0} votes
  </span>
</span>


                      <button
                        disabled={userVoted}
                        onClick={() => voteVendor(poll._id, v.vendorId._id)}
                        className={`px-4 py-2 font-bold rounded-lg transition ${
                          userVoted
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-green-300 hover:bg-green-400 text-black"
                        }`}
                      >
                        {userVoted ? "Voted" : "Vote"}
                      </button>
                    </div>
                  ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
