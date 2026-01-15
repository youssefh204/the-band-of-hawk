import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api/clubs",
  withCredentials: true,
});



// GET all clubs
const getClubs = () => API.get("/");

// JOIN club
const joinClub = (clubId) => API.post(`/${clubId}/join`);

// LEAVE club
const leaveClub = (clubId) => API.post(`/${clubId}/leave`);

const createClub = (body) => API.post("/create", body);

const deleteClub = (clubId) => API.delete(`/${clubId}/delete`);
const getClubById = (clubId) => API.get(`/${clubId}`);



export default {
  getClubs,
  joinClub,
  leaveClub,
  createClub,
  deleteClub,
  getClubById
};
