import axios from "axios"

const apiClient = axios.create({
  baseURL: "http://localhost:4000/api/auth",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});


apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access - please login")
    }
    return Promise.reject(error)
  },
)

export default apiClient
