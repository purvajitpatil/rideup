import axios from "axios";

// The backend address comes from an environment variable so the same code works locally and after deployment
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000" });

// Interceptor: attach the JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
