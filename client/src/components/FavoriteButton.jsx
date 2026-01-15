import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import axios from 'axios';

const FavoriteButton = ({ workshopId, tripId, size = 'medium' }) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    small: 'p-1 text-sm',
    medium: 'p-2',
    large: 'p-3 text-lg'
  };

  // Try multiple fields for user id
  const getUserId = () => {
    if (!user) return null;
    return user.id || user._id || user.userId || null;
  };

  const userId = getUserId();

  useEffect(() => {
    if (userId && (workshopId || tripId)) {
      checkFavoriteStatus();
    } else {
      setIsFavorite(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, workshopId, tripId]);

  const checkFavoriteStatus = async () => {
    if (!userId) {
      console.log('❌ No user ID found for favorites check');
      return;
    }
    try {
      const params = {};
      if (workshopId) params.workshopId = workshopId;
      if (tripId) params.tripId = tripId;

      console.log('🔍 Checking favorite status for user:', userId);

      const response = await axios.get(
        `http://localhost:4000/api/users/${userId}/favorites/check`,
        {
          params,
          withCredentials: true
        }
      );

      const fav = Boolean(response.data?.data?.isFavorite);
      setIsFavorite(fav);
      console.log('✅ Favorite status:', fav);
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const toggleFavorite = async () => {
    const currentUserId = getUserId();

    if (!currentUserId) {
      alert('Please log in to add favorites');
      console.log('❌ No user ID found when trying to toggle favorite');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        console.log('🗑️ Removing from favorites for user:', currentUserId);
        if (workshopId) {
          await axios.delete(
            `http://localhost:4000/api/users/${currentUserId}/favorites/workshops/${workshopId}`,
            { withCredentials: true }
          );
        } else if (tripId) {
          await axios.delete(
            `http://localhost:4000/api/users/${currentUserId}/favorites/trips/${tripId}`,
            { withCredentials: true }
          );
        }
        setIsFavorite(false);
        console.log('✅ Removed from favorites');
      } else {
        // Add to favorites
        console.log('❤️ Adding to favorites for user:', currentUserId);
        if (workshopId) {
          await axios.post(
            `http://localhost:4000/api/users/${currentUserId}/favorites/workshops`,
            { workshopId },
            { withCredentials: true }
          );
        } else if (tripId) {
          await axios.post(
            `http://localhost:4000/api/users/${currentUserId}/favorites/trips`,
            { tripId },
            { withCredentials: true }
          );
        }
        setIsFavorite(true);
        console.log('✅ Added to favorites');
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      console.error('Error response:', error.response?.data);

      if (error.response?.status === 401) {
        alert('Please log in again to use favorites');
      } else if (error.response?.status === 404) {
        alert('User not found. Please log in again.');
      } else {
        alert('Failed to update favorites: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no user
  if (!user) {
    console.log('👤 No user - not rendering FavoriteButton');
    return null;
  }

  if (!userId) {
    console.log('🆔 No user ID found in user object:', user);
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading || !userId}
      className={`
        ${sizeClasses[size]}
        ${!userId ? 'opacity-50 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20'}
        border border-white/20 hover:border-white/40
        rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        backdrop-blur-sm
      `}
      title={!userId ? 'Please log in to use favorites' : (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
    >
      {loading ? '⏳' : (isFavorite ? '❤️' : '🤍')}
    </button>
  );
};

export default FavoriteButton;
