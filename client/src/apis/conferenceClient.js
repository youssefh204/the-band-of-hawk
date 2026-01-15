import axios from "axios";

const conferenceClient = axios.create({
  baseURL: "http://localhost:4000/api/conferences",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const generateConferenceQR = (conferenceId, payload = {}) =>
  conferenceClient.post(`/${conferenceId}/qr`, payload);

export default conferenceClient;
