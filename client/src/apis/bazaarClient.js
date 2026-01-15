import axios from "axios";

const bazaarClient = axios.create({
  baseURL: "http://localhost:4000/api/bazaars", // ✅ Correct base URL
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
bazaarClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access - please login");
    }
    return Promise.reject(error);
  },
);
export default bazaarClient;
// generate QR for external visitors
export const generateBazaarQR = (bazaarId, payload = {}) =>
  bazaarClient.post(`/${bazaarId}/qr`, payload);
