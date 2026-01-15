import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clubAPI from "../apis/ClubAPI.js";

export default function ClubPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [newClub, setNewClub] = useState({
    clubName: "",
    Genre: "",
    Description: "",
    maxMemberNumbers: "",
  });

  const genres = ["Tech", "Art", "Development", "Other"];
  

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);
    } catch {
      setUser(null);
    }
  }, []);

  const loggedUserId = user?._id || user?.id;
  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === "admin";
  const isStudent = userRole === "student";

  // Fetch clubs
  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await clubAPI.getClubs();
      setClubs(Array.isArray(res.data?.clubs) ? res.data.clubs : []);
    } catch (err) {
      console.error("Failed to load clubs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // Create Club
  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await clubAPI.createClub(newClub);
      setNewClub({ clubName: "", Genre: "", Description: "", maxMemberNumbers: "" });
      fetchClubs();
      alert("Club created successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create club");
    } finally {
      setCreateLoading(false);
    }
  };

  // Join Club
  const handleJoin = async (clubId) => {
    try {
      setJoinLoading(clubId);
      await clubAPI.joinClub(clubId);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join");
    } finally {
      setJoinLoading(null);
    }
  };

  // Leave Club
  const handleLeave = async (clubId) => {
    try {
      setLeaveLoading(clubId);
      await clubAPI.leaveClub(clubId);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave");
    } finally {
      setLeaveLoading(null);
    }
  };

  // Delete Club (Admin)
  const handleDeleteClub = async (clubId) => {
    if (!window.confirm("Delete this club?")) return;
    try {
      await clubAPI.deleteClub(clubId);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete club");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-700 text-xl">
        Loading...
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-10">
      <div className="container mx-auto px-4">
          <div className="flex gap-4 mb-6">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow"
        >
          ← Back
        </button>

        {/* Club Events */}
        <button
          onClick={() => navigate("/club-events")}
          className="mb-6 bg-green-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow"
        >
          Club Events
        </button>
      </div>
        {/* Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-200 mb-10">
          <h1 className="text-3xl font-bold text-gray-800">🎓 Student Clubs</h1>
          <p className="text-gray-600">Join or manage clubs on campus</p>
        </div>

        {/* ADMIN: Create Club */}
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-200 mb-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create New Club</h2>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateClub}>

              <input
                type="text"
                placeholder="Club Name"
                value={newClub.clubName}
                onChange={(e) => setNewClub({ ...newClub, clubName: e.target.value })}
                required
                className="px-4 py-2 rounded-lg border border-gray-300"
              />

              <select
                value={newClub.Genre}
                onChange={(e) => setNewClub({ ...newClub, Genre: e.target.value })}
                required
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                <option value="">Select Genre</option>
                {genres.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Max Members"
                value={newClub.maxMemberNumbers}
                onChange={(e) =>
                  setNewClub({ ...newClub, maxMemberNumbers: e.target.value })
                }
                required
                className="px-4 py-2 rounded-lg border border-gray-300"
              />

              <textarea
                placeholder="Description"
                value={newClub.Description}
                onChange={(e) => setNewClub({ ...newClub, Description: e.target.value })}
                className="px-4 py-2 h-24 rounded-lg border border-gray-300 md:col-span-2"
              />

              <button
                type="submit"
                disabled={createLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl shadow-md md:col-span-2"
              >
                {createLoading ? "Creating..." : "Create Club"}
              </button>
            </form>
          </div>
        )}

        {/* CLUB LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => {
            const isMember = club.members?.some((m) => {
              const memberId = typeof m === "string" ? m : m._id?.toString();
              return memberId === loggedUserId;
            });

            const memberCount = club.members?.length || 0;
            const isFull = memberCount >= club.maxMemberNumbers;

            return (
              <div
                key={club._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
              >
                <h3 className="text-xl font-bold text-gray-800">{club.clubName}</h3>
                <p className="text-gray-600">🎭 Genre: {club.Genre}</p>
                <p className="text-gray-600">👥 {memberCount} / {club.maxMemberNumbers}</p>

                <p className="text-gray-500 mt-3">{club.Description}</p>

                {/* STUDENT ACTIONS */}
                {isStudent && (
                  <>
                    {!isMember ? (
                      <button
                        onClick={() => handleJoin(club._id)}
                        disabled={joinLoading === club._id || isFull}
                        className={`w-full mt-4 py-2 rounded-lg text-white ${
                          isFull
                            ? "bg-gray-400"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {isFull ? "Club Full" : joinLoading === club._id ? "Joining..." : "Join Club"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLeave(club._id)}
                        disabled={leaveLoading === club._id}
                        className="w-full mt-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                      >
                        {leaveLoading === club._id ? "Leaving..." : "Leave Club"}
                      </button>
                    )}
                  </>
                )}

                {/* ADMIN DELETE */}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteClub(club._id)}
                    className="w-full mt-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete Club
                  </button>
                  
                )}
                {isAdmin && (
                    <button
                    onClick={() => navigate(`/clubs/${club._id}`)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg mt-4"
                  >
                    View Details →
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
