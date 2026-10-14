import axios from "axios";

// The backend address comes from an environment variable so the same code works locally and after deployment
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const API = axios.create({ baseURL: API_URL });

// Interceptor: attach the JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorText = (err, fallback = "Something went wrong. Try again.") =>
  err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || (err.request ? "Can't reach the server. Check your connection." : fallback);

export default API;
