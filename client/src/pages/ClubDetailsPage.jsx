import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import clubAPI from "../apis/ClubAPI.js";
import axios from "axios";

export default function ClubDetails() {
  const { clubId } = useParams();
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const loggedUserId = user?._id || user?.id;
  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === "admin";
  const isStudent = userRole === "student";

  // Fetch club details
  const fetchClub = async () => {
    try {
      setLoading(true);
      const res = await clubAPI.getClubById(clubId);
      setClub(res.data.club);
    } catch (err) {
      console.error("Error loading club", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, [clubId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-700 text-xl">
        Loading club details...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500 text-xl">
        Club not found
      </div>
    );
  }

  const isMember = club.members?.some((m) => {
    const memberId = typeof m === "string" ? m : m._id?.toString();
    return memberId === loggedUserId;
  });

  const handleJoin = async () => {
    try {
      setActionLoading(true);
      await clubAPI.joinClub(club._id);
      fetchClub();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setActionLoading(true);
      await clubAPI.leaveClub(club._id);
      fetchClub();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this club?")) return;

    try {
      await clubAPI.deleteClub(club._id);
      navigate("/clubs");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-10">
      <div className="container mx-auto px-4">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow"
        >
          ← Back
        </button>

        {/* HEADER */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-200 mb-10">
          <h1 className="text-3xl font-bold text-gray-800">{club.clubName}</h1>
          <p className="text-gray-600 text-lg">🎭 {club.Genre}</p>

          <div className="mt-4 text-gray-700">
            <p>{club.Description || "No description provided."}</p>
          </div>

          {/* STUDENT ACTIONS */}
          {isStudent && (
            <div className="mt-6">
              {!isMember ? (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
                >
                  {actionLoading ? "Joining..." : "Join Club"}
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow"
                >
                  {actionLoading ? "Leaving..." : "Leave Club"}
                </button>
              )}
            </div>
          )}

          {/* ADMIN DELETE */}
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow"
            >
              Delete Club
            </button>
          )}
        </div>

        {/* MEMBERS SECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Members ({club.members?.length || 0})
          </h2>

          {club.members?.length > 0 ? (
            <ul className="space-y-3">
              {club.members.map((m) => (
                <li
                  key={typeof m === "string" ? m : m._id}
                  className="p-3 bg-orange-100 border border-orange-200 rounded-xl shadow-sm text-gray-800"
                >
                  {m.firstName && m.lastName
                    ? `${m.firstName} ${m.lastName}`
                    : m.email || "Unknown User"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No members yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
