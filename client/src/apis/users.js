import axios from "axios";

const users = axios.create({
  baseURL: "http://localhost:4000/api", // Remove /auth
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

users.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access - please login");
    }
    return Promise.reject(error);
  },
);

export default users;