// src/apis/workshopClient.js
import axios from "axios";

const workshopClient = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

workshopClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access - please login");
    }
    return Promise.reject(error);
  }
);

// Request interceptor: attach Authorization header from stored token if available
workshopClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// 🧠 Extra functions for Event Office
export const approveWorkshop = (id) => workshopClient.patch(`/workshops/${id}/approve`);
export const rejectWorkshop = (id) => workshopClient.patch(`/workshops/${id}/reject`);
export const requestWorkshopEdits = (id, note) =>
  workshopClient.patch(`/workshops/${id}/request-edits`, { note });

export default workshopClient;
// 👇 ADD THESE FOR YOUR TASKS 👇

// Task 38: Fetch the specific professor's workshops (Active & Archived)
// client/src/apis/workshopClient.js

export const getProfessorWorkshops = async () => {
  // 1. Get the token from storage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = user.token || localStorage.getItem('token'); 

  // 2. Send it in the header
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // 3. Make the request
  const response = await axios.get('/api/workshops/professor/my-workshops', config);
  return response.data;
};

// Task 39: Create Workshop (Triggers "New Request" Notification)
export const createWorkshop = async (workshopData) => {
  const response = await workshopClient.post('/workshops', workshopData);
  return response.data;
};

// (Optional) Update Status helper if you need it on the frontend
export const updateWorkshopStatus = (id, status) => 
  workshopClient.patch(`/workshops/${id}/${status}`);