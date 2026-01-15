import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../apis/workshopClient";
import axios from "axios";
import { useAuth } from "../components/AuthContext.jsx";
import ProfessorDashboard from "./ProfessorDashboard.jsx"; // adjust path if your file is in pages/


// Import the FavoriteButton component
import FavoriteButton from "../components/FavoriteButton.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import Wallet from "../components/Wallet.jsx";
import EditWorkshopSidebar from "../components/EditWorkshopSidebar.jsx";
import { cancelRegistration, getWalletBalance } from "../apis/paymentClient.js";
import { requestWorkshopCertificate } from "../apis/certificateClient.js"; // New import
import ExportAttendeesButton from "../components/ExportAttendeesButton.jsx";
import { socket } from "../socket";
import workshopClient from "../apis/workshopClient";



export default function Home() {
  const navigate = useNavigate();
  const { user: authUser, setUser: setAuthUser, logout } = useAuth();
  
  // Debug: print auth user to confirm id field name
  useEffect(() => {
    console.log("🔍 Debug - Auth User:", authUser);
    console.log("🔍 Debug - User ID from auth:", authUser?.id || authUser?._id || authUser?.userId);
    console.log("🔍 Debug - User ID from localStorage:", localStorage.getItem("user"));
  }, [authUser]);
  
  const [workshops, setWorkshops] = useState([]);
  const [bazaars, setBazaars] = useState([]);
  const [trips, setTrips] = useState([]);
  const [booths, setBooths] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [loyaltyVendors, setLoyaltyVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editSidebar, setEditSidebar] = useState({ open: false, workshop: null });
  const [error, setError] = useState(null);
  const [creatorInput, setCreatorInput] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("workshops");
  const [userWorkshops, setUserWorkshops] = useState([]);
  const [userTrips, setUserTrips] = useState([]);
  const [commentsModal, setCommentsModal] = useState({ open: false, event: null, type: null });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [showWallet, setShowWallet] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, qr: null, ticketId: null });
  const [filterCreator, setFilterCreator] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [notifications, setNotifications] = useState([]);
const [showNotif, setShowNotif] = useState(false);

  const [filterSort, setFilterSort] = useState("");
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    // Get user role and ID from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || user.userType || "student");
        setUserId(user.id || user._id);
        console.log("User role:", user.role || user.userType);
        console.log("User ID:", user.id || user._id);
        
        // Fetch user's joined workshops and trips
        if (user.id || user._id) {
          fetchUserJoinedEvents(user.id || user._id);
          fetchWallet();
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        setUserRole("student");
      }
    }
  }, []);


  const fetchWallet = async () => {
    try {
      const res = await getWalletBalance();
      setWallet(res.data.data);
    } catch (err) {
      console.error('Failed to fetch wallet');
    }
  };

  // Fetch user's joined workshops + trips + ratings
  async function fetchUserJoinedEvents(userId) {
    try {
      // 1️⃣ Fetch user event lists
      const userRes = await api.get(`/users/${userId}`);
      const userData = userRes.data.data;

      const joinedWorkshops = userData.workshops || [];
      const joinedTrips = userData.trips || [];

      setUserWorkshops(joinedWorkshops);
      setUserTrips(joinedTrips);
      console.log("DEBUG: userWorkshops after fetch:", joinedWorkshops);
      console.log("DEBUG: userTrips after fetch:", joinedTrips);

      // 2️⃣ Fetch user ratings for persistence
      const ratingsRes = await api.get(`/ratings/user/${userId}`);
      const userRatings = ratingsRes.data.data; // [{ eventId, rating }]

      const ratingMap = {};
      userRatings.forEach((r) => {
        ratingMap[r.eventId] = r.rating;
      });

      setRatings(ratingMap);

      console.log("🟢 Joined Workshops:", joinedWorkshops);
      console.log("🟢 Joined Trips:", joinedTrips);
      console.log("⭐ Loaded Ratings:", ratingMap);

    } catch (err) {
      console.error("❌ Error fetching user events and ratings:", err);
    }
  }
  useEffect(() => {
  if (!userRole) return;

  // Load existing notifications for this role
  const fetchNotifs = async () => {
    try {
      const res = await api.get(`/notifications/role/${userRole}`);
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error("Notif fetch error", err);
    }
  };
  fetchNotifs();

  // Listen for new realtime notifications
  socket.on("new-notification", (notif) => {
    if (notif.userRoles.includes(userRole.toLowerCase())) {
      setNotifications(prev => [notif, ...prev]);
    }
  });

  return () => socket.off("new-notification");
}, [userRole]);


  const creatorFromQuery = searchParams.get("creator") || "";

  useEffect(() => {
    const creator = creatorFromQuery;
    setCreatorInput(creator);
    fetchWorkshops(creator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWorkshops(creator) {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching workshops...");
      
      let res;
      if (creator) {
        res = await api.get(`/workshops/creator/${encodeURIComponent(creator)}`);
      } else {
        res = await api.get("/workshops");
      }
      
      console.log("📦 Workshops API response:", res);
      console.log("📊 Workshops response data:", res.data);
      
      // Handle different response formats
      let workshopsData = [];
      if (res.data && Array.isArray(res.data)) {
        workshopsData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        workshopsData = res.data.data;
      } else if (res.data && res.data.workshops) {
        workshopsData = res.data.workshops;
      } else {
        console.warn("Unexpected workshops response format:", res.data);
        workshopsData = [];
      }
      
      setWorkshops(workshopsData);
      console.log("✅ Final workshops state:", workshopsData);
    } catch (err) {
      console.error("❌ Error fetching workshops:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || err.message || "Failed to fetch workshops");
    } finally {
      setLoading(false);
    }
  }

  const refreshConferences = async () => {
  try {
    const res = fetchConferences();
    setConferences(res.data.data || []);
  } catch (err) {
    console.error("Failed to refresh conferences", err);
  }
};



const register = async (confId) => {
  try {
    await api.post(`/conferences/${confId}/register`);
    window.location.reload(); // 🔁 Force UI refresh
  } catch (err) {
    console.error("Registration error:", err);
    alert(err.response?.data?.message || "Registration failed");
  }
};

const unregister = async (confId) => {
  try {
    await api.post(`/conferences/${confId}/unregister`);
    window.location.reload(); // 🔁 Force UI refresh
  } catch (err) {
    console.error("Unregister error:", err);
    alert(err.response?.data?.message || "Unregister failed");
  }
};


const isRegisteredForConference = (confId) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const conferences = user?.eventRegistrations?.conferences || [];
  return conferences.some(reg => reg.confId === confId);
};



  async function fetchBazaars() {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching bazaars...");
      
      const res = await api.get("/bazaars");
      console.log("📦 Bazaars API response:", res);
      console.log("📊 Bazaars response data:", res.data);
      
      // Handle different response formats
      let bazaarsData = [];
      if (res.data && Array.isArray(res.data)) {
        bazaarsData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        bazaarsData = res.data.data;
      } else if (res.data && res.data.bazaars) {
        bazaarsData = res.data.bazaars;
      } else {
        console.warn("Unexpected bazaars response format:", res.data);
        bazaarsData = [];
      }
      
      setBazaars(bazaarsData);
      console.log("✅ Final bazaars state:", bazaarsData);
    } catch (err) {
      console.error("❌ Error fetching bazaars:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || err.message || "Failed to fetch bazaars");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTrips() {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching trips...");
      
      const res = await api.get("/trips");
      console.log("📦 Trips API response:", res);
      console.log("📊 Trips response data:", res.data);
      
      // Handle different response formats
      let tripsData = [];
      if (res.data && Array.isArray(res.data)) {
        tripsData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        tripsData = res.data.data;
      } else if (res.data && res.data.trips) {
        tripsData = res.data.trips;
      } else {
        console.warn("Unexpected trips response format:", res.data);
        tripsData = [];
      }
      
      setTrips(tripsData);
      console.log("✅ Final trips state:", tripsData);
    } catch (err) {
      console.error("❌ Error fetching trips:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || err.message || "Failed to fetch trips");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBooths() {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching booths...");

      let endpoint = "/application/all";

      const role = userRole?.toLowerCase();
      if (role === "vendor" || role === "student" || role === "ta" || role === "staff") {
        endpoint = "/application/all";
      }

      const res = await api.get(endpoint);
      console.log("📦 Booths API response:", res);
      console.log("📊 Booths response data:", res.data);
      
      // Handle different response formats
      let boothsData = [];
      if (res.data && Array.isArray(res.data)) {
        boothsData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        boothsData = res.data.data;
      } else if (res.data && res.data.booths) {
        boothsData = res.data.booths;
      } else if (res.data && res.data.applications) {
        boothsData = res.data.applications;
      } else {
        console.warn("Unexpected booths response format:", res.data);
        boothsData = [];
      }
      
      setBooths(boothsData);
      console.log("✅ Final booths state:", boothsData);
    } catch (err) {
      console.error("❌ Error fetching booth applications:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || err.message || "Failed to fetch booth applications");
    } finally {
      setLoading(false);
    }
  }

  async function fetchConferences() {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching conferences...");
      
      const res = await api.get("/conferences", {
        withCredentials: true
      });
      
      console.log("📦 Conferences API response:", res);
      console.log("📊 Conferences response data:", res.data);
      
      // Handle different response formats
      let conferencesData = [];
      if (res.data && Array.isArray(res.data)) {
        conferencesData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        conferencesData = res.data.data;
      } else if (res.data && res.data.conferences) {
        conferencesData = res.data.conferences;
      } else {
        console.warn("Unexpected conferences response format:", res.data);
        conferencesData = [];
      }
      
      setConferences(conferencesData);
      console.log("✅ Final conferences state:", conferencesData);
    } catch (err) {
      console.error("❌ Error fetching conferences:", err);
      console.error("Error response:", err.response);
      
      if (err.response?.status === 401) {
        setError("Please log in to view conferences");
        setConferences([]);
      } else {
        setError(err.response?.data?.message || err.message || "Failed to fetch conferences");
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchLoyaltyVendors() {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching loyalty vendors...");
      
      const res = await axios.get("http://localhost:4000/api/vendor/loyalty/vendors", {
        withCredentials: true
      });
      
      console.log("📦 Loyalty vendors API response:", res);
      console.log("📊 Loyalty vendors response data:", res.data);
      
      // Handle different response formats
      let vendorsData = [];
      if (res.data && Array.isArray(res.data)) {
        vendorsData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        vendorsData = res.data.data;
      } else {
        console.warn("Unexpected loyalty vendors response format:", res.data);
        vendorsData = [];
      }
      
      setLoyaltyVendors(vendorsData);
      console.log("✅ Final loyalty vendors state:", vendorsData);
    } catch (err) {
      console.error("❌ Error fetching loyalty vendors:", err);
      console.error("Error response:", err.response);
      
      if (err.response?.status === 401) {
        setError("Please log in to view loyalty vendors");
        setLoyaltyVendors([]);
      } else {
        setError(err.response?.data?.message || err.message || "Failed to fetch loyalty vendors");
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle tab change
 const handleTabChange = (tab) => {
    console.log(`🔄 Switching to tab: ${tab}`);
    setActiveTab(tab);
    setSearchInput("");
    
    // Fetch data when switching to a new tab if not already loaded
    if (tab === "bazaars" && bazaars.length === 0) {
      console.log("📦 Fetching bazaars...");
      fetchBazaars();
    } else if (tab === "trips" && trips.length === 0) {
      console.log("✈️ Fetching trips...");
      fetchTrips();
    } else if (tab === "booths" && booths.length === 0) {
      console.log("🏪 Fetching booths...");
      fetchBooths();
    } else if (tab === "conferences" && conferences.length === 0) {
      console.log("🎤 Fetching conferences...");
      fetchConferences();
    } else if (tab === "loyalty" && loyaltyVendors.length === 0) {
      console.log("💳 Fetching loyalty vendors...");
      fetchLoyaltyVendors();
    } else if (tab === "workshops" && workshops.length === 0) {
      console.log("🎓 Fetching workshops...");
      fetchWorkshops("");
    }
    else if (tab === "archive") {
      if (workshops.length === 0) fetchWorkshops("");
      if (trips.length === 0) fetchTrips();
      if (bazaars.length === 0) fetchBazaars();
      if (conferences.length === 0) fetchConferences();
    }
    // Note: Registered events tab doesn't need to fetch data separately
    // as it uses the already loaded userWorkshops and userTrips
    
    console.log(`📊 Current ${tab} count: ${
      tab === "workshops" ? workshops.length :
      tab === "bazaars" ? bazaars.length :
      tab === "trips" ? trips.length :
      tab === "booths" ? booths.length :
      tab === "conferences" ? conferences.length :
      tab === "registered" ? (userWorkshops.length + userTrips.length) : 0
    }`);
  };

  // Join Workshop
  async function handleJoinWorkshop(workshop) {
    if (workshop.price > 0) {
      setSelectedEvent({ ...workshop, eventType: 'workshop' });
      setPaymentModalOpen(true);
    } else {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.put(`/users/${userId}/workshops/${workshop._id}`);
        console.log("DEBUG: Successfully joined free workshop on server. Now updating client state.");
        
        // Extract the new registration from the server response
        // The server response now contains the updated user object with populated registrations
        const updatedUserWorkshops = response.data.user.eventRegistrations.workshops;
        const newRegistration = updatedUserWorkshops.find(
          reg => reg.workshopId && reg.workshopId._id === workshop._id
        );

        if (newRegistration) {
          setUserWorkshops(prev => [...prev, newRegistration]);
        } else {
          // Fallback: if new registration not found, re-fetch all registrations
          fetchUserJoinedEvents(userId);
        }
        
        alert("Successfully joined the free workshop!");
      } catch (err) {
        console.error("Error joining workshop:", err);
        setError(err.response?.data?.message || err.message || "Failed to join workshop");
      } finally {
        setLoading(false);
      }
    }
  }

  // Join Trip
  async function handleJoinTrip(trip) {
    if (trip.price > 0) {
      setSelectedEvent({ ...trip, eventType: 'trip' });
      setPaymentModalOpen(true);
    } else {
      try {
        setLoading(true);
        setError(null);
        
        await api.put(`/users/${userId}/trips/${trip._id}`);
        
        // Update local state
        setUserTrips(prev => [...prev, trip]);
        
        alert("Successfully joined the free trip!");
      } catch (err) {
        console.error("Error joining trip:", err);
        setError(err.response?.data?.message || err.message || "Failed to join trip");
      } finally {
        setLoading(false);
      }
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    alert('Payment successful and registration complete! A receipt has been sent to your email.');
    fetchUserJoinedEvents(userId);
    fetchWallet();
  };

  // Leave Workshop with Refund
  async function handleLeaveWorkshop(workshopId) {
    try {
      setLoading(true);
      
      // Get workshop details to check price and date
      const workshopRes = await api.get(`/workshops/${workshopId}`);
      const workshop = workshopRes.data.data;
      
      if (!workshop) {
        alert("Workshop not found");
        return;
      }

      // Check if it's a paid workshop and cancellation policy
      const twoWeeksBefore = new Date(workshop.endDateTime).getTime() - (14 * 24 * 60 * 60 * 1000);
      const now = new Date();
      
      if (workshop.price > 0 && now < twoWeeksBefore) {
        // Eligible for refund
        if (confirm(`You paid $${workshop.price} for this workshop. Cancel and get refund to your wallet?`)) {
          try {
            const result = await cancelRegistration({ 
              eventType: 'workshop', 
              eventId: workshopId 
            });
            
            if (result.data.success) {
              alert(`✅ Cancellation successful! $${result.data.data.refundAmount} has been refunded to your wallet.`);
              fetchUserJoinedEvents(userId);
              fetchWallet();
            } else {
              alert(result.data.message || "Cancellation failed");
            }
          } catch (err) {
            console.error('Refund error:', err);
            alert(err.response?.data?.message || "Refund failed. Please try again.");
          }
        }
      } else if (workshop.price > 0 && now >= twoWeeksBefore) {
        // Not eligible for refund
        alert("❌ Cancellation not allowed. Must cancel at least 2 weeks before the event for a refund.");
      } else {
        // Free workshop - just leave without refund
        if (confirm("Are you sure you want to leave this workshop?")) {
          await api.delete(`/users/${userId}/workshops/${workshopId}`);
          alert("Successfully left the workshop!");
          fetchUserJoinedEvents(userId);
        }
      }
    } catch (err) {
      console.error("Error leaving workshop:", err);
      alert(err.response?.data?.message || "Failed to leave workshop");
    } finally {
      setLoading(false);
    }
  }

  // Leave Trip with Refund
  async function handleLeaveTrip(tripId) {
    try {
      setLoading(true);
      
      // Get trip details to check price and date
      const tripRes = await api.get(`/trips/${tripId}`);
      const trip = tripRes.data.data;
      
      if (!trip) {
        alert("Trip not found");
        return;
      }

      // Check if it's a paid trip and cancellation policy
      const twoWeeksBefore = new Date(trip.endDateTime).getTime() - (14 * 24 * 60 * 60 * 1000);
      const now = new Date();
      
      if (trip.price > 0 && now < twoWeeksBefore) {
        // Eligible for refund
        if (confirm(`You paid $${trip.price} for this trip. Cancel and get refund to your wallet?`)) {
          try {
            const result = await cancelRegistration({ 
              eventType: 'trip', 
              eventId: tripId 
            });
            
            if (result.data.success) {
              alert(`✅ Cancellation successful! $${result.data.data.refundAmount} has been refunded to your wallet.`);
              fetchUserJoinedEvents(userId);
              fetchWallet();
            } else {
              alert(result.data.message || "Cancellation failed");
            }
          } catch (err) {
            console.error('Refund error:', err);
            alert(err.response?.data?.message || "Refund failed. Please try again.");
          }
        }
      } else if (trip.price > 0 && now >= twoWeeksBefore) {
        // Not eligible for refund
        alert("❌ Cancellation not allowed. Must cancel at least 2 weeks before the event for a refund.");
      } else {
        // Free trip - just leave without refund
        if (confirm("Are you sure you want to leave this trip?")) {
          await api.delete(`/users/${userId}/trips/${tripId}`);
          alert("Successfully left the trip!");
          fetchUserJoinedEvents(userId);
        }
      }
    } catch (err) {
      console.error("Error leaving trip:", err);
      alert(err.response?.data?.message || "Failed to leave trip");
    } finally {
      setLoading(false);
    }
  }

  async function handleRateEvent(eventId, eventType, rating) {
    try {
      setLoading(true);

      if (!userId) {
        console.error("❌ userId missing!");
        alert("Please log in first!");
        return;
      }

      const payload = { userId, eventId, eventType, rating };
      console.log("📤 Sending rating:", payload);

      const res = await api.post("/ratings", payload);

      const saved = res.data.data;

      setRatings(prev => ({
        ...prev,
        [eventId]: saved.rating,
      }));

      alert("Thanks for rating!");
    } catch (err) {
      console.error("❌ Rating failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Could not submit rating");
            } finally {
              setLoading(false);
            }
          }
    
          async function handleGetCertificate(workshop) {
            try {
              if (!userId) {
                alert("Please log in to request a certificate.");
                return;
              }
    
              const now = new Date();
              const workshopEndDate = new Date(workshop.endDateTime);
    
              if (now < workshopEndDate) {
                alert("The workshop is not done yet. You can request a certificate after the workshop has concluded.");
                return;
              }
    
              setLoading(true);
              const response = await requestWorkshopCertificate(workshop._id);
              alert(response.data.message || "Certificate request submitted. Please check your email.");
            } catch (error) {
              console.error("Error requesting certificate:", error);
              alert(error.response?.data?.message || "Failed to request certificate. Please try again.");
            } finally {
              setLoading(false);
            }
          }
    
              const getWorkshopRegistration = (workshopId) => {
                return userWorkshops.find(reg => reg.workshopId?._id === workshopId);
              };
            
              // Check if user has joined a workshop
              const hasJoinedWorkshop = (workshopId) => {
                return userWorkshops.some(reg => reg.workshopId?._id === workshopId);            };
          
            // Check if user has joined a trip
            const hasJoinedTrip = (tripId) => {
              return userTrips.some(reg => reg.tripId?._id === tripId);  };
              async function generateTicket(eventId, tab) {
  const eventType = tab === "bazaars" ? "bazaar" : "conference";
  const res = await api.post(`/tickets/${eventType}/${eventId}`);
  setQrModal({ open: true, qr: res.data.qr, ticketId: res.data.ticketId });
}


  // Helper to check if an event has concluded
  const hasEventConcluded = (item) => {
    const now = new Date();
    // For registered events, item is a registration object with populated workshopId/tripId
    const eventEndDate = item.eventType === 'workshop' 
      ? new Date(item.workshopId?.endDateTime || item.workshopId?.startDateTime)
      : new Date(item.tripId?.endDateTime || item.tripId?.startDateTime);
    
    // Fallback for events from other tabs if they ever get here without proper date fields
    if (isNaN(eventEndDate.getTime())) {
      const genericEndDate = new Date(item.endDateTime || item.startDateTime || item.displayDate);
      if (!isNaN(genericEndDate.getTime())) return now > genericEndDate;
      return false; // Cannot determine if concluded
    }
    return now > eventEndDate;
  };

  // Check if user is registered for an event
  const isUserRegisteredForEvent = (eventId, eventType) => {
    console.log(`DEBUG: Checking registration for Event ID: ${eventId}, Type: ${eventType}`);
    console.log("DEBUG: Current userWorkshops:", userWorkshops);
    console.log("DEBUG: Current userTrips:", userTrips);
    if (eventType === "Workshop") {
      const result = userWorkshops.some(reg => reg.workshopId?._id === eventId);
      console.log(`DEBUG: isUserRegisteredForEvent (Workshop): ${result}`);
      return result;
    } else if (eventType === "Trip") {
      const result = userTrips.some(reg => reg.tripId?._id === eventId);
      console.log(`DEBUG: isUserRegisteredForEvent (Trip): ${result}`);
      return result;
    }
    console.log("DEBUG: isUserRegisteredForEvent (Other type): false");
    return false;
  };

  // ✅ Approve / Reject / Request-Edits for cookie-based authentication
  async function handleStatusChange(id, action) {
    try {
      setLoading(true);
      setError(null);

      const validActions = ["approve", "reject", "request-edits"];
      if (!validActions.includes(action)) {
        throw new Error(`Invalid action: ${action}`);
      }

      console.log("🔍 Making workshop status change request...");
      console.log("Action:", action);
      console.log("Workshop ID:", id);
      console.log("User Role:", userRole);

      const res = await api.patch(
        `/workshops/${id}/${action}`,
        {},
        {
          withCredentials: true
        }
      );

      const updated = res.data.data;
      setWorkshops((prev) =>
        prev.map((w) => (w._id === id ? { ...w, status: updated.status } : w))
      );

      alert(`Workshop ${action}d successfully!`);
    } catch (err) {
      console.error(`Error during ${action}:`, err);
      console.error("Error details:", err.response?.data);

      if (err.response?.status === 403) {
        setError(`Access denied: You don't have permission to ${action} workshops. Required role: Admin or EventOffice. Your role: ${userRole}`);
      } else if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else {
        setError(err.response?.data?.message || err.message || `Failed to ${action} workshop`);
      }
    } finally {
      setLoading(false);
    }
  }
async function handleArchive(id) {
    if (confirm("Are you sure you want to archive this workshop?")) {
      try {
        setLoading(true);
        await api.patch(`/workshops/${id}/archive`, {}, { withCredentials: true });
        // Update UI to remove it or show as archived
        setWorkshops(prev => prev.map(w => w._id === id ? { ...w, status: 'archived' } : w));
        alert("Workshop archived successfully!");
      } catch (err) {
        setError("Failed to archive");
      } finally {
        setLoading(false);
      }
    }
  }
  // Check if user can perform admin actions
  const canPerformAdminActions = () => {
    const role = userRole?.toLowerCase();
    return role === "admin" || role === "eventoffice" || role === "EventOffice";
  };

  // Check if user should only see approved events
  const shouldSeeOnlyApproved = () => {
    const role = userRole?.toLowerCase();
    return role === "student" || role === "ta" || role === "staff";
  };

  // Check if user should see multiple tabs
  const shouldSeeMultipleTabs = () => {
    const role = userRole?.toLowerCase();
    return role === "student" || role === "ta" || role === "staff" || role === "professor"||role === "eventoffice" || role === "EventOffice";
  };

  // Check if user should see registered events tab
  const shouldSeeRegisteredEvents = () => {
    const role = userRole?.toLowerCase();
    return role === "student" || role === "ta" || role === "staff" || role === "professor"||role === "eventoffice" || role === "EventOffice";;
  };

  // Check if user is EventOffice
  const isEventOffice = () => {
    const role = userRole?.toLowerCase();
    return role === "eventoffice" || role === "EventOffice";
  };

  // Get filtered data for registered events tab
  const getRegisteredEvents = () => {
    const registeredEvents = [];
    
    // Add workshops with event type info
    userWorkshops.forEach(workshop => {
      registeredEvents.push({
        ...workshop,
        eventType: 'workshop',
        displayName: workshop.workshopName,
        displayDate: workshop.startDateTime,
        displayLocation: workshop.location
      });
    });
    
    // Add trips with event type info
    userTrips.forEach(trip => {
      registeredEvents.push({
        ...trip,
        eventType: 'trip',
        displayName: trip.tripName,
        displayDate: trip.startDateTime,
        displayLocation: trip.Destination
      });
    });
    
    return registeredEvents;
  };

  const getFilteredData = () => {
    let data = [];

    // --------------------------
    // 1️⃣ Select data based on tab
    // --------------------------
    switch (activeTab) {
      case "workshops":
        data = workshops || [];
        break;
      case "bazaars":
        data = bazaars || [];
        break;
      case "trips":
        data = trips || [];
        break;
      case "booths":
        data = booths || [];
        break;
      case "conferences":
        data = conferences || [];
        break;
      case "loyalty":
        data = loyaltyVendors || [];
        break;
      case "registered":
        data = getRegisteredEvents();
        break;

      // 🗄️ ARCHIVE LOGIC (Task 47)
      // Filters past events from all categories
      case "archive":
        const now = new Date();
        data = [
          ...workshops.filter(w => w.endDateTime && new Date(w.endDateTime) < now).map(w => ({ ...w, eventType: 'workshop', displayDate: w.endDateTime })),
          ...trips.filter(t => t.endDateTime && new Date(t.endDateTime) < now).map(t => ({ ...t, eventType: 'trip', displayDate: t.endDateTime })),
          ...bazaars.filter(b => b.endDate && new Date(b.endDate) < now).map(b => ({ ...b, eventType: 'bazaar', displayDate: b.endDate })),
          ...conferences.filter(c => c.endDateTime && new Date(c.endDateTime) < now).map(c => ({ ...c, eventType: 'conference', displayDate: c.endDateTime }))
        ];
        break;

      default:
        data = [];
        break;
    }

    // --------------------------
    // 2️⃣ Search Filter
    // --------------------------
    if (searchInput.trim()) {
      const s = searchInput.toLowerCase();
      data = data.filter((item) => {
        // Check all possible name fields since Archive has mixed types
        const name = item.workshopName || item.tripName || item.bazaarName || item.name || item.vendorId?.companyName || item.displayName || "";
        return name.toLowerCase().includes(s);
      });
    }

    return data;
  };

  const filteredData = getFilteredData();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err?.message || err);
    }
    navigate("/login");
  };

  const isStudent = userRole?.toLowerCase() === "student";
  const isProfessor = userRole?.toLowerCase() === "professor";
  const isTA = userRole?.toLowerCase() === "ta";
  const isStaff = userRole?.toLowerCase() === "staff";
  const isEventOfficeRole = ["eventoffice", "eventsoffice", "events office", "admin"].includes(userRole?.toLowerCase());
  const isAdmin = userRole?.toLowerCase() === "admin";
  const seesOnlyApproved = shouldSeeOnlyApproved();
  const showsMultipleTabs = shouldSeeMultipleTabs();
  const showsRegisteredEvents = shouldSeeRegisteredEvents();

  // Get tab display name
  // in Home.jsx
const getTabDisplayName = (tab) => {
    const tabNames = {
      workshops: "🎓 Workshops",
      bazaars: "🛍️ Bazaars",
      trips: "✈️ Trips",
      booths: "🏪 Booths",
      conferences: "🎤 Conferences",
      loyalty: "💎 Loyalty",
      registered: "📋 Registered Events",
      dashboard: "🎓 My Dashboard", // or professorDashboard
      archive: "🗄️ Archive" // 👈 ADD THIS
    };
    return tabNames[tab] || tab;
  };


  // Get search placeholder based on active tab
  const getSearchPlaceholder = () => {
    const placeholders = {
      workshops: "Search by name, creator, or faculty...",
      bazaars: "Search by bazaar name, location, or description...",
      trips: "Search by trip name, destination, or description...",
      booths: "Search by booth name, vendor, or location...",
      conferences: "Search by conference name, creator, or description...",
      loyalty: "Search by vendor name, discount rate, or promo code...",
      registered: "Search by event name, location, or type..."
    };
    return placeholders[activeTab] || "Search...";
  };

  // Comment Modal Component (with Ratings Tab)
  const CommentModal = () => {
    if (!commentsModal.open) return null;

    const [activeSubTab, setActiveSubTab] = useState("comments");
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [ratingsData, setRatingsData] = useState({ avgRating: 0, ratingsCount: 0, ratings: [] });
    
    const isRegistered = isUserRegisteredForEvent(commentsModal.event._id, commentsModal.type);
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    // Fetch Comments + Ratings when modal opens or tabs switch
    useEffect(() => {
      if (activeSubTab === "comments") {
        fetchComments();
      } else if (activeSubTab === "ratings") {
        fetchRatings();
      }
    }, [activeSubTab]);

    async function fetchComments() {
      try {
        const res = await api.get(`/comments/event/${commentsModal.type}/${commentsModal.event._id}`);
        setComments(res.data.data || []);
      } catch (e) {
        console.error("Comments fetch failed:", e);
        setComments([]);
      }
    }

    async function fetchRatings() {
      try {
        const res = await api.get(`/ratings/event/${commentsModal.event._id}/reviews`);
        setRatingsData({
          avgRating: res.data.avgRating,
          ratingsCount: res.data.ratingsCount,
          ratings: res.data.ratings
        });
      } catch (e) {
        console.error("Ratings fetch failed:", e);
        setRatingsData({ avgRating: 0, ratingsCount: 0, ratings: [] });
      }
    }

    async function handleSubmitComment(e) {
      e.preventDefault();
      if (!newComment.trim()) return;

      if (!isRegistered) {
        alert("You must be registered to comment!");
        return;
      }

      try {
        const res = await api.post(`/comments`, {
          content: newComment,
          eventId: commentsModal.event._id,
          eventType: commentsModal.type
        });

        setComments(prev => [res.data.data, ...prev]);
        setNewComment('');
      } catch (err) {
        alert(err.response?.data?.message || "Failed to post comment");
      }
    }

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-white-900 to-orange-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">
              {commentsModal.event.workshopName || commentsModal.event.tripName || commentsModal.event.name} - Comments & Ratings
            </h3>
            <button
              onClick={() => setCommentsModal({ open: false, event: null, type: null })}
              className="text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mb-4 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveSubTab("comments")}
              className={`flex-1 py-2 rounded-md transition ${
                activeSubTab === "comments" 
                  ? "bg-pink-500 text-white" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              💬 Comments
            </button>
            <button
              onClick={() => setActiveSubTab("ratings")}
              className={`flex-1 py-2 rounded-md transition ${
                activeSubTab === "ratings" 
                  ? "bg-pink-500 text-white" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              ⭐ Ratings
            </button>
          </div>

          {/* Comments Tab */}
          {activeSubTab === "comments" && (
            <div>
              {/* Comment Form */}
              {isRegistered ? (
                <form onSubmit={handleSubmitComment} className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this event..."
                    className="w-full px-3 py-2 bg-white/10 text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    rows="3"
                  />
                  <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition"
                  >
                    Post Comment
                  </button>
                </form>
              ) : (
                <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/50">
                  <p className="text-blue-300 text-center">
                    Register for this event to post comments!
                  </p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-3">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment._id} className="bg-white/10 p-3 rounded-lg">
                      <p className="text-white">{comment.content}</p>
                      <p className="text-white/50 text-sm mt-1">
                        By {comment.userId?.name || "Anonymous"} • {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-white/60 text-center">No comments yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Ratings Tab */}
          {activeSubTab === "ratings" && (
            <div className="text-white">
              {/* Avg Rating */}
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-yellow-400">{ratingsData.avgRating} ★</p>
                <p className="text-sm text-white/70">{ratingsData.ratingsCount} ratings</p>
              </div>

              {/* Quick Registration for Non-Registered Users */}
              {!isRegistered ? (
                <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/50">
                  <p className="text-blue-300 text-center mb-3">
                    Want to share your thoughts? Register for this event first!
                  </p>
                  <div className="flex justify-center gap-2">
                    {commentsModal.type === "Workshop" && (
                      <button
                        onClick={() => {
                          handleJoinWorkshop(commentsModal.event);
                          setCommentsModal({ open: false, event: null, type: null });
                        }}
                        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                      >
                        Join Workshop
                      </button>
                    )}
                    {commentsModal.type === "Trip" && (
                      <button
                        onClick={() => {
                          handleJoinTrip(commentsModal.event);
                          setCommentsModal({ open: false, event: null, type: null });
                        }}
                        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                      >
                        Join Trip
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Rating List (Registered Users Only) */
                <div className="space-y-3 mt-4">
                  {ratingsData.ratings.map((r) => (
                    <div key={r._id} className="bg-white/10 p-3 rounded-lg">
                      <p className="font-semibold">
                        {Array(r.rating).fill("⭐").join("")}
                      </p>
                    </div>
                  ))}

                  {ratingsData.ratingsCount === 0 && (
                    <p className="text-white/60 text-center">No ratings yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-white-700 via-orange-600 to-indigo-500 animate-gradient-x py-8 relative">
      {/* Navigation */}
      
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center">

        {/* 👇 NEW: Standalone Archive Button for Events Office */}
           {isEventOfficeRole && (
             <button 
               onClick={() => handleTabChange("archive")} 
               className={`px-6 py-3 font-semibold rounded-lg backdrop-blur-xl border transition-all hover:scale-105 flex items-center gap-2 shadow-lg ${
                 activeTab === "archive" 
                   ? "bg-gray-200 text-black border-white" // Active Style
                   : "bg-gray-600 hover:bg-gray-500 text-white border-gray-400" // Inactive Style
               }`}
             >
               🗄️ Past Events
             </button>
           )}
        <div className="flex gap-4">
          {isStudent && (
            <Link
              to="/courts"
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg backdrop-blur-xl border border-green-300 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              🏀 Courts
            </Link>
            
          )}
           {isStudent && (         <Link
                    to="/clubs"
                    className="text-white font-semibold bg-yellow-500/40 hover:bg-green-500/70 px-4 py-2 rounded-lg shadow-md backdrop-blur-md transition"
                  >
                    Clubs
                  </Link>
                     )}
                      <Link
              to="/polls"
              className="px-6 py-3 bg-Black-500 hover:bg-Black-600 text-white font-semibold rounded-lg backdrop-blur-xl border border-gray-300 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
               polls
            </Link>
          {/* --- PROFESSOR BUTTONS --- */}
          {isProfessor && (
            <>
              {/* 1. Create Workshop Button */}
              <Link
                to="/workshops/new"
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg backdrop-blur-xl border border-blue-300 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                ➕ Create Workshop
              </Link>
            </>
          )}
          {/* EventOffice Buttons */}
          {isEventOfficeRole && (
            <>
              <button
                onClick={() => window.location.href = "http://localhost:5000/conferences"}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg backdrop-blur-xl border border-orange-300 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                🎤 Conferences
              </button>
            </>
          )}
                    {userId && (
            <Link
              to="/Documents"
              className="px-6 py-3 bg-black-500 hover:bg-pink-600 text-white font-semibold rounded-lg backdrop-blur-xl border border-pink-300 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              Documents
            </Link>
          )}

          {/* Favorites Button for ALL Logged-in Users */}
          {userId && (
            <Link
              to="/sales-report"
              className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg backdrop-blur-xl border border-pink-300 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              Sales Report
            </Link>
          )}

          {/* Gym Button for ALL Roles */}
          <button
            onClick={() => window.location.href = "http://localhost:5000/gym"}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg backdrop-blur-xl border border-red-300 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
          >
            🏋️ Gym
          </button>
          {userId && (
  <div className="relative">
    <button
      onClick={() => setShowNotif(!showNotif)}
      className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold 
                 rounded-lg backdrop-blur-xl border border-yellow-300 transition-all 
                 hover:scale-105 flex items-center gap-2 shadow-lg"
    >
      🔔 Notifications
      {notifications.length > 0 && (
        <span className="ml-2 bg-red-600 text-white px-2 rounded-full text-xs">
          {notifications.length}
        </span>
      )}
    </button>

    {showNotif && (
      <div className="absolute top-14 right-0 bg-black/80 p-3 rounded-xl 
                      w-72 shadow-lg border border-white/20 z-50">
        <h4 className="text-white font-bold mb-2">Notifications</h4>

        {notifications.length === 0 ? (
          <p className="text-white/60 text-sm text-center">No notifications</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className="text-white p-2 mb-2 bg-white/10 rounded-lg 
                         cursor-pointer hover:bg-white/20 transition"
            >
              {n.message}
            </div>
          ))
        )}
      </div>
    )}
  </div>
)}


          {/* Wallet Button */}
          {userId && (
            <button
              onClick={() => setShowWallet(!showWallet)}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg backdrop-blur-xl border border-yellow-300 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              💰 Wallet
            </button>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="ml-auto text-white font-semibold bg-pink-500/40 hover:bg-pink-500/70 px-4 py-2 rounded-lg shadow-md backdrop-blur-md transition"
        >
          Log-Out
        </button>
      </div>

      {/* Wallet Component */}
      {showWallet && (
        <div className="fixed top-24 right-6 z-50">
          <Wallet />
        </div>
      )}

      {/* Main */}
      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 mb-6">
            <h2 className="text-4xl font-extrabold text-center text-white drop-shadow-lg mb-2">
              Campus Events
            </h2>
            <p className="text-white/80 text-center mb-6">
              Discover and explore campus activities
              {userRole && (
                <span className="block text-sm mt-2 text-yellow-300">
                  Logged in as: {userRole} 
                  {isEventOfficeRole && " 🔧"}
                  {seesOnlyApproved && activeTab === "workshops" && " 👀 (Viewing approved workshops only)"}
                  {isAdmin && " ⚡ (Admin)"}
                  {isProfessor && " 🎓 (Professor)"}
                </span>
              )}
            </p>

            {/* Tabs for Students, TA, Staff, Professor */}
            {/* Tabs block — replace the array part with this */}
{showsMultipleTabs && (
              <div className="flex justify-center mb-6">
                <div className="bg-white/10 rounded-xl p-1 backdrop-blur-md flex flex-wrap justify-center gap-2">
                  {[
                    "workshops",
                    "bazaars",
                    "trips",
                    "booths",
                    "conferences",
                    "loyalty",
                    ...(showsRegisteredEvents ? ["registered"] : []),
                    
                    ...(isProfessor ? ["dashboard"] : []) // (renamed to match your dashboard key)
                  ].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`px-6 py-2 font-medium rounded-lg transition-all ${
                        activeTab === tab
                          ? "bg-pink-500 text-white shadow-lg"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {getTabDisplayName(tab)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create Workshop Button for Professors */}
            {isProfessor && activeTab === "workshops" && (
              <div className="flex justify-center mb-6">
                <Link
                  to="/workshops/new"
                  className="px-6 py-3 font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-transform transform hover:scale-105 shadow-lg"
                >
                  Create New Workshop
                </Link>
              </div>
            )}

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={getSearchPlaceholder()}
                  className="flex-1 px-4 py-2 text-white placeholder-white/70 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20"
                />
                <button
                  type="submit"
                  className="px-6 py-2 font-medium text-white bg-purple-500 rounded-xl hover:bg-purple-600 transition"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="px-6 py-2 font-medium text-white bg-gray-500/50 rounded-xl hover:bg-gray-600/50 transition"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Advanced Filters */}
            <div className="mt-4 bg-white/10 p-4 rounded-xl border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Creator Name */}
                <input
                  value={filterCreator}
                  onChange={(e) => setFilterCreator(e.target.value)}
                  placeholder="Professor name / creator"
                  className="px-3 py-2 w-full bg-black/40 text-white rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-2 focus:ring-pink-400"
                />

                {/* Location Filter */}
                <input
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  placeholder="Location"
                  className="px-3 py-2 w-full bg-black/40 text-white rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-2 focus:ring-pink-400"
                />

                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 w-full bg-black/40 text-white rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="" className="text-black">Event Type</option>
                  <option value="workshop">Workshop</option>
                  <option value="trip">Trip</option>
                  <option value="bazaar">Bazaar</option>
                  <option value="conference">Conference</option>
                  <option value="booth">Booth</option>
                </select>

                {/* Date Filter */}
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 w-full bg-black/40 text-white rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-2 focus:ring-pink-400"
                />

                {/* Sort Filter */}
                <select
                  value={filterSort}
                  onChange={(e) => setFilterSort(e.target.value)}
                  className="px-3 py-2 w-full bg-black/40 text-white rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="">Sort By Date</option>
                  <option value="asc">Date: Oldest First</option>
                  <option value="desc">Date: Newest First</option>
                </select>
              </div>
            </div>

            {/* Workshop-specific creator filter */}
            {activeTab === "workshops" && (isAdmin || isEventOfficeRole || isProfessor) && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchWorkshops(creatorInput);
                }} 
                className="mb-4"
              >
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <label className="text-white font-medium text-sm">
                    Filter by creator email:
                  </label>
                  <input
                    value={creatorInput}
                    onChange={(e) => setCreatorInput(e.target.value)}
                    placeholder="e.g., ahmed.hassan@guc.edu.eg"
                    className="flex-1 max-w-md px-4 py-2 text-white placeholder-white/70 bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 border border-white/20 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 font-medium text-white bg-purple-500 rounded-xl hover:bg-purple-600 transition text-sm"
                  >
                    Filter Creator
                  </button>
                </div>
              </form>
            )}

            {/* Debug buttons - remove later */}
            <div className="text-center mb-4 space-x-2">
              {activeTab === "trips" && (
                <button
                  onClick={fetchTrips}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  🔄 Trips
                </button>
              )}
              {activeTab === "bazaars" && (
                
                <button
                  onClick={fetchBazaars}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  🔄 Bazaars
                </button>
              )}
              {activeTab === "conferences" && (
                <button
                  onClick={fetchConferences}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  🔄 Conferences
                </button>
              )}
              {activeTab === "workshops" && (
                <button
                  onClick={() => fetchWorkshops("")}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  🔄 Workshops
                </button>
              )}
              {activeTab === "booths" && (
                <button
                  onClick={fetchBooths}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  🔄 Booths
                </button>
              )}
              <p className="text-white/60 text-sm mt-2">
                {getTabDisplayName(activeTab)} loaded: {
                  activeTab === "workshops" ? workshops.length :
                  activeTab === "bazaars" ? bazaars.length :
                  activeTab === "trips" ? trips.length :
                  activeTab === "booths" ? booths.length :
                  activeTab === "conferences" ? conferences.length :
                  activeTab === "registered" ? (userWorkshops.length + userTrips.length) : 0
                } | Status: {loading ? "Loading..." : "Ready"}
              </p>
            </div>
          </div>
          

          {/* Loading & Errors */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white mt-2">Loading {getTabDisplayName(activeTab).toLowerCase()}...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
              <p className="text-red-200 text-center">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 px-4 py-1 text-white bg-red-500/50 hover:bg-red-600/50 rounded transition"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Events List */}

          {!loading && filteredData.length > 0 && (
            <div className="space-y-4">
              {filteredData.map((item) => (
                <div
                  key={item._id}
                  className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {item.workshopName || item.bazaarName || item.tripName || item.boothName || item.name || item.vendorId?.companyName || item.displayName || "Untitled Event"}
                        </h3>
                        
                        {/* Show event type badge for registered events */}
                        {activeTab === "registered" && (
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            item.eventType === 'workshop' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-green-500 text-white'
                          }`}>
                            {item.eventType === 'workshop' ? '🎓 Workshop' : '✈️ Trip'}
                          </span>
                        )}
                        
                        {/* Show status badge only for workshops */}
                        {activeTab === "workshops" && item.status && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              item.status === "approved"
                                ? "bg-green-500 text-white"
                                : item.status === "rejected"
                                ? "bg-red-500 text-white"
                                : item.status === "needs-edit"
                                ? "bg-yellow-500 text-black"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {item.status || "pending"}
                          </span>
                        )}

                        {/* Show joined badge for workshops and trips */}
                        {(activeTab === "workshops" && hasJoinedWorkshop(item._id)) && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            ✅ Joined
                          </span>
                        )}
                        {(activeTab === "trips" && hasJoinedTrip(item._id)) && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            ✅ Joined
                          </span>
                        )}
                      </div>
                      
                      {/* Event-specific details with corrected field names */}
                      <div className="text-white/70 text-sm mb-2">
                        {activeTab === "workshops" && (
                          <>
                            📍 {item.location} • 🗓️{" "}
                            {new Date(item.startDateTime).toLocaleString()} -{" "}
                            {new Date(item.endDateTime).toLocaleString()}
                          </>
                        )}
                        {activeTab === "bazaars" && (
                          <>
                            📍 {item.location} • 🗓️{" "}
                            {new Date(item.startDate).toLocaleDateString()} -{" "}
                            {new Date(item.endDate).toLocaleDateString()}
                          </>
                        )}
                        {activeTab === "trips" && (
                          <>
                            🎯 {item.Destination} • 🗓️{" "}
                            {new Date(item.startDateTime).toLocaleDateString()} • 💰 ${item.price}
                          </>
                        )}
                        {activeTab === "booths" && (
                          <>
                            📍 {item.location} • 🏢 {item.vendor}
                          </>
                        )}
                        {activeTab === "conferences" && (
                          <>
                            📍 {item.location} • 🗓️{" "}
                            {new Date(item.startDateTime).toLocaleString()} -{" "}
                            {new Date(item.endDateTime).toLocaleString()}


                          </>
                        )}
                        {activeTab === "registered" && (
                          <>
                            📍 {item.displayLocation || item.location || item.Destination} • 🗓️{" "}
                            {new Date(item.displayDate || item.startDateTime).toLocaleString()}
                            {item.eventType === 'trip' && item.price && ` • 💰 $${item.price}`}
                          </>
                        )}
                        {activeTab === "loyalty" && (
                          <>
                            💰 Discount: <strong>{item.discountRate}%</strong> • 🏷️ Code: <strong>{item.promoCode}</strong>
                          </>
                        )}
                      </div>
                      
                      <p className="text-white/80 mb-3">
                        {activeTab === "loyalty" 
                          ? item.termsAndConditions 
                          : (item.shortDescription || item.Description || item.description || "No description available.")}
                      </p>
                      
                      <div className="text-white/60 text-xs mb-2">
                        {activeTab === "workshops" && (
                          <>
                            <span className="bg-purple-500/30 px-2 py-1 rounded mr-2">
                              🎓 {item.faculty}
                            </span>
                            <span className="bg-pink-500/30 px-2 py-1 rounded">
                              👤 {item.createdBy}
                            </span>
                          </>
                        )}
                        {activeTab === "bazaars" && (
                          <span className="bg-purple-500/30 px-2 py-1 rounded">
                            📍 {item.location}
                          </span>
                        )}
                        {activeTab === "trips" && (
                          <>
                            <span className="bg-purple-500/30 px-2 py-1 rounded mr-2">
                              🎯 {item.Destination}
                            </span>
                            <span className="bg-green-500/30 px-2 py-1 rounded">
                              👥 {item.Travelers?.length || 0}/{item.capacity}
                            </span>
                          </>
                        )}
                        {activeTab === "booths" && (
                          <span className="bg-purple-500/30 px-2 py-1 rounded">
                            🏪 {item.vendor}
                          </span>
                        )}
                        {activeTab === "conferences" && (
                          <span className="bg-purple-500/30 px-2 py-1 rounded">
                            👤 {item.createdBy}
                          </span>
                        )}
                        {activeTab === "registered" && (
                          <span className="bg-purple-500/30 px-2 py-1 rounded">
                            ✅ Registered
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Debugging for Join/Leave buttons */}
                      {activeTab === "workshops" && (
                        <>
                          <p className="hidden">
                            {"DEBUG: Workshop ID: " + item._id + ", Name: " + item.workshopName}
                          </p>
                          <p className="hidden">
                            {"DEBUG: hasJoinedWorkshop(" + item._id + "): " + hasJoinedWorkshop(item._id)}
                          </p>
                        </>
                      )}
                      {/* Favorite Button - Available for workshops and trips */}
                      {(activeTab === "workshops" || activeTab === "trips") && (
                        <FavoriteButton 
                          workshopId={activeTab === "workshops" ? item._id : null}
                          tripId={activeTab === "trips" ? item._id : null}
                          size="medium"
                        />
                      )}
                                {(isEventOfficeRole || isAdmin) && 
        (activeTab === "bazaars" || activeTab === "conferences") && (
          <button
            className="px-4 py-2 rounded-lg bg-yellow-500 text-black hover:bg-yellow-600"
            onClick={() => generateTicket(item._id, activeTab)}
          >
            🎫 Generate Ticket QR
          </button>
        )}

                      {/* View Details Button for loyalty vendors */}
                      {activeTab === "loyalty" && (
                        <button
                          onClick={() => alert(`📜 Terms & Conditions:\n\n${item.termsAndConditions}`)}
                          className="px-4 py-2 text-white bg-blue-500/60 hover:bg-blue-500/80 rounded-lg transition"
                        >
                          📜 View Terms
                        </button>
                      )}

                      {/* Certificate Button for workshops */}
                      {activeTab === "workshops" && 
                       hasJoinedWorkshop(item._id) && 
                       new Date(item.endDateTime) < new Date() &&
                       getWorkshopRegistration(item._id)?.certificateSent === false && (
                        <>
                          <p className="hidden">
                            {"DEBUG: For Certificate - Workshop ID: " + item._id + ", Name: " + item.workshopName}
                          </p>
                          <p className="hidden">
                            {"DEBUG: activeTab === \"workshops\": " + (activeTab === "workshops")}
                          </p>
                          <p className="hidden">
                            {"DEBUG: hasJoinedWorkshop(" + item._id + "): " + hasJoinedWorkshop(item._id)}
                          </p>
                          <p className="hidden">
                            {"DEBUG: item.endDateTime: " + item.endDateTime + ", Current Date: " + new Date()}
                          </p>
                          <p className="hidden">
                            {"DEBUG: new Date(item.endDateTime) < new Date(): " + (new Date(item.endDateTime) < new Date())}
                          </p>
                          <p className="hidden">
                            {"DEBUG: getWorkshopRegistration(" + item._id + ") result: " + JSON.stringify(getWorkshopRegistration(item._id))}
                          </p>
                          <p className="hidden">
                            {"DEBUG: reg?.certificateSent: " + getWorkshopRegistration(item._id)?.certificateSent}
                          </p>
                          <p className="hidden">
                            {"DEBUG: reg?.certificateSent === false: " + (getWorkshopRegistration(item._id)?.certificateSent === false)}
                          </p>
                        </>
                      )}
                      {activeTab === "workshops" && 
                       hasJoinedWorkshop(item._id) && 
                       new Date(item.endDateTime) < new Date() &&
                       getWorkshopRegistration(item._id)?.certificateSent === false && (
                        <button
                          className="px-4 py-2 text-white bg-white-600 hover:bg-orange-700 rounded-lg transition transform hover:scale-105"
                          onClick={() => handleGetCertificate(item)}
                          disabled={loading}
                        >
                          Get Certificate
                        </button>
                      )}

                      {/* Comment Button - Available for all events, but shows registration status */}
                      {(activeTab === "workshops" || activeTab === "trips" || activeTab === "conferences") && (
                        <button
                          onClick={() => setCommentsModal({ 
                            open: true, 
                            event: item, 
                            type: activeTab === "workshops" ? "Workshop" : 
                                  activeTab === "trips" ? "Trip" : 
                                  "Conference" 
                          })}
                          className={`px-4 py-2 rounded-lg transition ${
                            isUserRegisteredForEvent(item._id, 
                              activeTab === "workshops" ? "Workshop" : 
                              activeTab === "trips" ? "Trip" : 
                              "Conference"
                            )
                              ? "text-white bg-blue-500/60 hover:bg-blue-500/80"
                              : "text-white/70 bg-gray-500/40 hover:bg-gray-500/60"
                          }`}
                          title={
                            isUserRegisteredForEvent(item._id, 
                              activeTab === "workshops" ? "Workshop" : 
                              activeTab === "trips" ? "Trip" : 
                              "Conference"
                            )
                              ? "View and post comments"
                              : "View comments only (register to post)"
                          }
                        >
                          💬 {isUserRegisteredForEvent(item._id, 
                            activeTab === "workshops" ? "Workshop" : 
                            activeTab === "trips" ? "Trip" : 
                            "Conference"
                          ) ? "Comments" : "View Comments"}
                        </button>
                        
                      )}
{activeTab === "conferences" && (
  <button
    onClick={() =>
      isRegisteredForConference(item._id)
        ? unregister(item._id)
        : register(item._id)
    }
    className={`px-4 py-2 rounded-lg text-white font-semibold transition-all ${
      isRegisteredForConference(item._id)
        ? "bg-red-600 hover:bg-red-700"
        : "bg-green-600 hover:bg-green-700"
    }`}
  >
    {isRegisteredForConference(item._id) ? "Leave Conference" : "Register"}
  </button>
)}

                      {/* ⭐ Star Rating: only if user joined */}
                      {(activeTab === "workshops" || activeTab === "trips") && (
                        <>
                          <p className="hidden">
                            {"DEBUG: For ratings - Event ID: " + item._id + ", Type: " + (activeTab === "workshops" ? "Workshop" : "Trip")}
                          </p>
                          <p className="hidden">
                            {"DEBUG: isUserRegisteredForEvent(" + item._id + ", " + (activeTab === "workshops" ? "Workshop" : "Trip") + "): " + isUserRegisteredForEvent(item._id, activeTab === "workshops" ? "Workshop" : "Trip")}
                          </p>
                        </>
                      )}
                      {(activeTab === "workshops" || activeTab === "trips") &&
                      isUserRegisteredForEvent(item._id,
                          activeTab === "workshops" ? "Workshop" : "Trip") && (
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(num => (
                            <button
                              key={num}
                              onClick={() =>
                                handleRateEvent(item._id,
                                  activeTab === "workshops" ? "Workshop" : "Trip",
                                  num)
                              }
                              className={`text-xl ${
                                ratings[item._id] >= num ? "text-yellow-400" : "text-gray-400"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        
                      )}

                      {/* Leave button for registered events */}
                      {activeTab === "registered" && !hasEventConcluded(item) && (
                        <>
                          {item.eventType === 'workshop' && (
                            <button
                              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition transform hover:scale-105"
                              onClick={() => handleLeaveWorkshop(item._id)}
                              disabled={loading}
                            >
                              Leave Workshop
                            </button>
                          )}
                          {item.eventType === 'trip' && (
                            <button
                              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition transform hover:scale-105"
                              onClick={() => handleLeaveTrip(item._id)}
                              disabled={loading}
                            >
                              Leave Trip
                            </button>
                          )}
                        </>
                      )}


                      {/* Edit/Delete for workshops (visible to creator or admin) */}
                      {activeTab === "workshops" && (userId === item.createdBy || isEventOfficeRole || isAdmin) && (
                        <>
                      <button
                        className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition"
                        onClick={() => setEditSidebar({ open: true, workshop: item })}
                      >
                        ✏️ Edit
                      </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Delete this workshop?")) {
                                api.delete(`/workshops/${item._id}`).then(() =>
                                  setWorkshops((prev) =>
                                    prev.filter((w) => w._id !== item._id)
                                  )
                                );
                              }
                            }}
                            className="px-4 py-2 text-white bg-red-500/60 hover:bg-red-500/80 rounded-lg transition"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {/* 📥 Export Attendees Button for EventOffice/Admin */}
{(isEventOfficeRole || isAdmin) && (
  <>
    {activeTab === "workshops" && (
      <ExportAttendeesButton
        eventType="workshop"
        eventId={item._id}
      />
    )}
    {activeTab === "trips" && (
      <ExportAttendeesButton
        eventType="trip"
        eventId={item._id}
      />
    )}
  </>
)}





                      {/* ✅ Approval Actions for workshops (Admins + EventOffice) */}
                      {activeTab === "workshops" && (isEventOfficeRole || isAdmin) && (
                        <div className="flex flex-wrap gap-2">
                          {item.status !== "approved" && (
                            <button
                              onClick={() => handleStatusChange(item._id, "approve")}
                              className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition transform hover:scale-105"
                              title="Approve this workshop"
                            >
                              ✅ Approve
                            </button>
                          )}
                          {item.status !== "rejected" && (
                            <button
                              onClick={() => handleStatusChange(item._id, "reject")}
                              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition transform hover:scale-105"
                              title="Reject this workshop"
                            >
                              ❌ Reject
                            </button>
                          )}
                          {item.status !== "needs-edit" && (
                            <button
                              onClick={() => handleStatusChange(item._id, "request-edits")}
                              className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition transform hover:scale-105"
                              title="Request edits for this workshop"
                            >
                              ✏️ Request Edits
                            </button>
                          )}
                          {activeTab === "workshops" && isEventOfficeRole && item.status !== 'archived' && (
                          <button 
                            onClick={() => handleArchive(item._id)} 
                            className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition transform hover:scale-105"
                            title="Archive this workshop"
                          >
                            🗄️ Archive
                          </button>
                        )}
                          
                        </div>
                        
                      )}
                      

                      {/* Join/Leave buttons for workshops and trips ONLY (not in registered tab) */}
                      
                      {(activeTab === "workshops" || activeTab === "trips") && showsMultipleTabs && activeTab !== "registered" && (
                        <>
                          {activeTab === "workshops" && !hasJoinedWorkshop(item._id) && (
                            <button
                              className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition transform hover:scale-105"
                              onClick={() => handleJoinWorkshop(item)}
                              disabled={loading}
                            >
                              Join Workshop
                            </button>
                          )}
                          {activeTab === "workshops" && hasJoinedWorkshop(item._id) && (
                            <button
                              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition transform hover:scale-105"
                              onClick={() => handleLeaveWorkshop(item._id)}
                              disabled={loading}
                            >
                              Leave Workshop
                            </button>
                          )}
                          {activeTab === "trips" && !hasJoinedTrip(item._id) && (
                            <button
                              className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition transform hover:scale-105"
                              onClick={() => handleJoinTrip(item)}
                              disabled={loading}
                            >
                              Join Trip
                            </button>
                          )}
                          {activeTab === "trips" && hasJoinedTrip(item._id) && (
                            <button
                              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition transform hover:scale-105"
                              onClick={() => handleLeaveTrip(item._id)}
                              disabled={loading}
                            >
                              Leave Trip
                            </button>
                          )}
                        </>
                      )}
                      
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
          )}
{/* Render professor dashboard inside Home when active */}
{activeTab === "professorDashboard" && (
  <div style={{ padding: 8 }}>
    <ProfessorDashboard embedded={true} />
  </div>
)}

          {/* Empty State */}
          {!loading && filteredData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg">
                {activeTab === "workshops" && seesOnlyApproved 
                  ? `No approved ${activeTab} found` + (searchInput ? " matching your search." : ".")
                  : activeTab === "registered"
                  ? "No registered events found" + (searchInput ? " matching your search." : ".")
                  : `No ${activeTab} found` + (searchInput ? " matching your search." : ".")
                }
              </p>
              {activeTab === "workshops" && seesOnlyApproved && !searchInput && (
                <p className="text-white/50 text-sm mt-2">
                  There are currently no approved workshops available. Check back later!
                </p>
              )}
              {activeTab === "registered" && !searchInput && (
                <p className="text-white/50 text-sm mt-2">
                  You haven't registered for any workshops or trips yet.
                </p>
                
              )}
              {isProfessor && activeTab === "workshops" && (
                <Link
                  to="/workshops/new"
                  className="inline-block mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all hover:scale-105"
                >
                  Create Your First Workshop
                </Link>
                
              )}
            </div>
            
          )}
        </div>
        
      </div>
      {editSidebar.open && (
  <EditWorkshopSidebar
    workshop={editSidebar.workshop}
    onClose={() => setEditSidebar({ open: false, workshop: null })}
    onUpdated={() => fetchWorkshops("")}
  />
)}


      {/* Comment Modal */}
      <CommentModal />

      {qrModal.open && (
  <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-xl text-center">
      <img src={qrModal.qr} className="w-64 mx-auto mb-4" />
      <p className="font-mono text-sm mb-2">🎟 Ticket ID: {qrModal.ticketId}</p>
      <button
        className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        onClick={() => setQrModal({ open: false })}
      >
        Close
      </button>
    </div>
  </div>
)}


      {/* Payment Modal */}
      {paymentModalOpen && (
        <PaymentModal
          event={selectedEvent}
          eventType={selectedEvent.eventType}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}
    </div>
  );
}