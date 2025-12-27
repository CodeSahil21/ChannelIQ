import { Server } from "socket.io";
import http from "http";
import { TypedServer } from "./types";
import { verifySocketAuth } from "../middleware/socketMiddleware";
import { registerChatHandlers } from "./chatHandlers";
import prisma from "../db/index";
import { SessionManager } from "./sessionManager";
import { CacheService, CacheKeys } from '../utils/cache';
import { config } from '../utils/config';
import { setSocketServer } from './emitters';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient, connectPubSub } from '../redis';

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
      methods: ["GET", "POST"]
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
  });

  // Initialize Redis pub/sub connections and adapter
  const initializeRedis = async () => {
    try {
      await connectPubSub();
      
      // Set up Socket.io Redis adapter for cross-instance room management
      // This automatically handles cross-instance communication without duplicates
      io.adapter(createAdapter(pubClient, subClient));
      
      console.log('Redis adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis for Socket.io:', error);
      // Continue without Redis adapter - single instance mode
    }
  };

  // Initialize Redis in background
  initializeRedis();

  io.use(verifySocketAuth);

  // Register socket server for Kafka consumer access
  setSocketServer(io);

  io.on("connection", async (socket) => {
    try {
      // Sanitize user ID for logging to prevent log injection
      const sanitizedUserId = socket.user?.id?.toString().replace(/[\x00-\x1F\x7F\r\n]/g, '') || 'Unknown';
      console.log("Connected:", sanitizedUserId);
      
      if (!socket.user?.id) {
        socket.disconnect();
        return;
      }

      socket.join(`user:${socket.user.id}`);
      
      // ✅ Cache groupIds for reconnect storms
      let groupIds: string[] | null = null;

      try {
        groupIds = await CacheService.get<string[]>(CacheKeys.socketUserGroups(socket.user.id));
      } catch {
        // ignore redis issues; fallback to DB
      }

      if (!groupIds) {
        const memberships = await prisma.groupMember.findMany({
          where: { userId: socket.user.id },
          select: { groupId: true },
        });
        groupIds = memberships.map(m => m.groupId);

        try {
          await CacheService.set(CacheKeys.socketUserGroups(socket.user.id), groupIds, config.CACHE_TTL.SOCKET_GROUPS);
        } catch {
          // ignore
        }
      }

      for (const groupId of groupIds) {
        socket.join(`group:${groupId}`);
        SessionManager.addUserToGroup(socket.id, groupId);
      }
      
      registerChatHandlers(io, socket);
    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect();
    }
  });

  return io;
};