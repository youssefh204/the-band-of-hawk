import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api/club-events",
  withCredentials: true
});

export default {
  getEvents: () => API.get("/"),
  getEventById: (id) => API.get(`/${id}`),
  createEvent: (data) => API.post("/", data),
  updateStatus: (id, data) => API.put(`/${id}/status`, data),
  deleteEvent: (id) => API.delete(`/${id}`)
};
