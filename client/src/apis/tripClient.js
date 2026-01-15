import axios from "axios";

const tripClient = axios.create({
  baseURL: "http://localhost:4000/api/trips", // ✅ Same pattern as bazaarClient
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

tripClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access - please login");
    }
    return Promise.reject(error);
  },
);

export default tripClient;