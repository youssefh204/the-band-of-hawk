// apis/paymentClient.js
import axios from 'axios';

const paymentClient = axios.create({
  baseURL: "http://localhost:4000/api/payments",
  withCredentials: true,
});

paymentClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`, config.data);
  return config;
});

paymentClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const createPaymentIntent = (data) => paymentClient.post('/create-payment-intent', data);
export const confirmPayment = (data) => paymentClient.post('/confirm-payment', data);
export const cancelRegistration = (data) => paymentClient.post('/cancel-registration', data);
export const getWalletBalance = () => paymentClient.get('/wallet');
export const addToWallet = (amount) => paymentClient.post('/wallet/top-up', { amount });

// 🆕 NEW: Stripe wallet top-up
export const createWalletTopUpIntent = (data) => paymentClient.post('/wallet/top-up/stripe', data);
export const confirmWalletTopUp = (data) => paymentClient.post('/wallet/top-up/confirm', data);

export default paymentClient;