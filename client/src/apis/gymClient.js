import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api",
  withCredentials: true,
});

const gymAPI = {
  getSessions: () => api.get("/gym"),
  createSession: (data) => api.post("/gym", data),
  joinSession: (id) => api.post(`/gym/${id}/join`),
  cancelSession: (id) => api.post(`/gym/${id}/cancel`),
  deleteSession: (id) => api.delete(`/gym/${id}`),
  updateSession: (id, data) => api.put(`/gym/${id}`, data),
  getAvailable: () => api.get("/gym/available"),
};

export default gymAPI;
