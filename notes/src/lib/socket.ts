import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const socket = io(API_BASE_URL, {
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("[socket] connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("[socket] connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("[socket] disconnected:", reason);
});
