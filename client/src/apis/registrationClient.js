// apis/registrationClient.js
import axios from 'axios';

const registrationClient = axios.create({
  baseURL: "http://localhost:4000/api/registrations",
  withCredentials: true,
});

registrationClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getMyRegistrations = () => registrationClient.get('/my-registrations');

export const cancelWorkshopRegistration = (workshopId) => 
  registrationClient.delete(`/workshops/${workshopId}/cancel`);

export const cancelTripRegistration = (tripId) =>
  registrationClient.delete(`/trips/${tripId}/cancel`);
