import axios from "axios";

export const checkAuth = async () => {
  try {
    const res = await axios.get("http://localhost:4000/api/auth/check", {
      withCredentials: true,
    });

    if (res.data.success) {
      return res.data.user; // decoded { id, role }
    }
    return null;
  } catch (err) {
    console.error("Auth check failed:", err.response?.data || err.message);
    return null;
  }
};
