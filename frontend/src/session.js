import { io } from "socket.io-client";
import { API_URL } from "./api.js";

export const getRole = () => localStorage.getItem("role");
export const hasSession = (role) => !!localStorage.getItem("token") && getRole() === role;
export const saveSession = (token, role) => { localStorage.setItem("token", token); localStorage.setItem("role", role); };
export const clearSession = () => { localStorage.removeItem("token"); localStorage.removeItem("role"); };

// One authenticated socket per screen. role is "user" (rider) or "captain".
export const connectSocket = (role) =>
  io(API_URL, { auth: { token: localStorage.getItem("token"), role }, transports: ["websocket", "polling"] });
