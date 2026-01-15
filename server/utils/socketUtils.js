import { io } from "../server.js";

export const sendNotificationToUser = (userId, notification) => {
  io.to(userId.toString()).emit("notification", notification);
};
