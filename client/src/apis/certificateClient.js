// apis/certificateClient.js
import axios from 'axios';

const certificateClient = axios.create({
  baseURL: "http://localhost:4000/api/certificates",
  withCredentials: true,
});

certificateClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const sendWorkshopCertificates = (workshopId) => 
  certificateClient.post(`/workshops/${workshopId}/send`);

export const requestWorkshopCertificate = (workshopId) =>
  certificateClient.post('/request-workshop-certificate', { workshopId });
