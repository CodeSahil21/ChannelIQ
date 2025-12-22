import { Server } from "socket.io";
import http from "http";
import { TypedServer } from "./types";
import { verifySocketAuth } from "../middleware/socketMiddleware";
import { registerChatHandlers } from "./chatHandlers";

export const initSocket = (server: http.Server): TypedServer => {
  // Use same CORS configuration as REST API
  const corsOrigins = process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URLS?.split(',').filter(origin => origin.trim()) || []
    : ["http://localhost:3000", "http://localhost:5173", "http://localhost:4000"];
  
  if (corsOrigins.length === 0) {
    throw new Error('FRONTEND_URLS must be configured for production');
  }
  
  const io: TypedServer = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.use(verifySocketAuth);

  io.on("connection", (socket) => {
    try {
      // Sanitize user ID for logging to prevent log injection
      const sanitizedUserId = socket.user?.id?.toString().replace(/[\x00-\x1F\x7F\r\n]/g, '') || 'Unknown';
      console.log("Connected:", sanitizedUserId);
      
      if (!socket.user?.id) {
        socket.disconnect();
        return;
      }

      socket.join(`user:${socket.user.id}`);
      registerChatHandlers(io, socket);
    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect();
    }
  });

  return io;
};