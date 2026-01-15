import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🧠 Automatically check login status when app loads
  useEffect(() => {
    const checkAuth = async () => {
      // If a token exists in localStorage, set it on axios headers so /api/auth/check uses it
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (e) {
        console.error('Failed to read token from localStorage:', e);
      }
      try {
        const res = await axios.get("http://localhost:4000/api/auth/check", { withCredentials: true });
        const rawUser = res.data.user;
        // Normalize user object so components can rely on `id`
const u = rawUser
  ? {
      ...rawUser,
      id: rawUser.id || rawUser._id || rawUser.userId || null,
      role: rawUser.role?.toLowerCase() || ""
    }
  : null;

        setUser(u); // backend should send full user data
        try {
          localStorage.setItem('user', JSON.stringify(u));
        } catch (e) {
          console.error('Failed to persist user to localStorage:', e);
        }
      } catch (err) {
        setUser(null);
        try { localStorage.removeItem('user'); } catch {};
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (userData) => {
    // Normalize incoming user data to ensure `id` is present
const u = userData
  ? {
      ...userData,
      id: userData.id || userData._id || userData.userId || null,
      role: userData.role?.toLowerCase() || ""
    }
  : null;
    setUser(u);
    try { localStorage.setItem('user', JSON.stringify(u)); } catch (e) { console.error(e); }
  };
  const logout = async () => {
    try {
      await axios.post("http://localhost:4000/api/auth/logout", {}, { withCredentials: true });
    } catch (e) {
      console.error('Logout request failed:', e);
    }
    setUser(null);
    try { localStorage.removeItem('user'); } catch (e) { console.error(e); }
    try { localStorage.removeItem('token'); } catch (e) { console.error(e); }
    try { delete axios.defaults.headers.common['Authorization']; } catch (e) { console.error('Failed to clear axios auth header', e); }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
