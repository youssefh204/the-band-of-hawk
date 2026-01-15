import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext.jsx";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState({ workshops: [], trips: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchFavorites = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:4000/api/users/${user.id}/favorites`,
        { withCredentials: true }
      );
      setFavorites(response.data.data || { workshops: [], trips: [] });
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (type, id) => {
    try {
      if (type === 'workshop') {
        await axios.delete(
          `http://localhost:4000/api/users/${user.id}/favorites/workshops/${id}`,
          { withCredentials: true }
        );
      } else if (type === 'trip') {
        await axios.delete(
          `http://localhost:4000/api/users/${user.id}/favorites/trips/${id}`,
          { withCredentials: true }
        );
      }
      // Refresh favorites after removal
      fetchFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
      alert('Failed to remove from favorites');
    }
  };

  if (authLoading) return <div className="p-6 text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-purple-900 to-blue-900">
        <div className="max-w-4xl mx-auto bg-black/60 p-8 rounded-2xl border border-white/10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Favorites</h2>
          <p className="text-white/70 mb-4">Please log in to view your favorites.</p>
          <Link 
            to="/login" 
            className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl transition"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  const totalFavorites = (favorites.workshops?.length || 0) + (favorites.trips?.length || 0);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-900 to-blue-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-black/60 p-8 rounded-2xl border border-white/10 mb-6">
          <h2 className="text-4xl font-bold text-white mb-2">Your Favorites</h2>
          <p className="text-white/70">
            {totalFavorites === 0 
              ? "You don't have any favorites yet. Add events to your favorites to see them here."
              : `You have ${totalFavorites} favorite event${totalFavorites === 1 ? '' : 's'}`
            }
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-white mt-2">Loading favorites...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Favorite Workshops */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                🎓 Workshops ({favorites.workshops?.length || 0})
              </h3>
              {favorites.workshops?.length === 0 ? (
                <p className="text-white/60 text-center py-4">
                  No favorite workshops yet
                </p>
              ) : (
                <div className="space-y-4">
                  {favorites.workshops.map((workshop) => (
                    <div key={workshop._id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-1">
                            {workshop.workshopName}
                          </h4>
                          <p className="text-white/60 text-sm mb-2">
                            📍 {workshop.location} • 🎓 {workshop.faculty}
                          </p>
                          <p className="text-white/70 text-sm line-clamp-2">
                            {workshop.shortDescription}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Link 
                              to={`/workshops/${workshop._id}`}
                              className="px-3 py-1 bg-blue-500/50 hover:bg-blue-500/70 text-white text-sm rounded transition"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => removeFavorite('workshop', workshop._id)}
                              className="px-3 py-1 bg-red-500/50 hover:bg-red-500/70 text-white text-sm rounded transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite Trips */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                ✈️ Trips ({favorites.trips?.length || 0})
              </h3>
              {favorites.trips?.length === 0 ? (
                <p className="text-white/60 text-center py-4">
                  No favorite trips yet
                </p>
              ) : (
                <div className="space-y-4">
                  {favorites.trips.map((trip) => (
                    <div key={trip._id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-1">
                            {trip.tripName}
                          </h4>
                          <p className="text-white/60 text-sm mb-2">
                            📍 {trip.Destination} • 💰 ${trip.price}
                          </p>
                          <p className="text-white/70 text-sm line-clamp-2">
                            {trip.Description}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Link 
                              to={`/trips/${trip._id}`}
                              className="px-3 py-1 bg-green-500/50 hover:bg-green-500/70 text-white text-sm rounded transition"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => removeFavorite('trip', trip._id)}
                              className="px-3 py-1 bg-red-500/50 hover:bg-red-500/70 text-white text-sm rounded transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
