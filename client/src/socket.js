import { io } from "socket.io-client";

// Your backend server where socket.io is running
export const socket = io("http://localhost:4000", {
  withCredentials: true,
  transports: ["websocket"]
});
