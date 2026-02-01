import { Server } from "socket.io";
import http from "http";
import { TypedServer } from "./types";
import { verifySocketAuth } from "../middleware/socketMiddleware";
import { registerChatHandlers } from "./chatHandlers";
import prisma from "../db/index";
import { SessionManager } from "./sessionManager";
import { CacheService, CacheKeys } from '../utils/cache';
import { setSocketServer } from './emitters';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient, connectPubSub } from '../redis';
import { activeConnections } from '../utils/metrics';
import logger from '../utils/logger';

export const initSocket = (server: http.Server): TypedServer => {
  const io: TypedServer = new Server(server, {
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    path: '/chat-socket/',
    cors: {
      origin: true, // Allow all origins since ingress handles CORS
      credentials: true
    }
  });

  // Initialize Redis pub/sub connections and adapter
  const initializeRedis = async () => {
    try {
      await connectPubSub();
      
      // Set up Socket.io Redis adapter for cross-instance room management
      // This automatically handles cross-instance communication without duplicates
      io.adapter(createAdapter(pubClient, subClient));
      
      logger.info('Redis adapter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis for Socket.io', { error });
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
      // Increment active connections metric
      activeConnections.inc();
      logger.info('WebSocket connected', { userId: socket.user.id });
      
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
          await CacheService.set(CacheKeys.socketUserGroups(socket.user.id), groupIds, 60); // 1 minute
        } catch {
          // ignore
        }
      }

      for (const groupId of groupIds) {
        socket.join(`group:${groupId}`);
        SessionManager.addUserToGroup(socket.id, groupId);
      }
      
      registerChatHandlers(io, socket);
      
      // Add disconnect handler for metrics
      socket.on('disconnect', () => {
        activeConnections.dec();
        logger.info('WebSocket disconnected', { userId: socket.user?.id });
      });
    } catch (error) {
      logger.error('Socket connection error', { error, userId: socket.user?.id });
      socket.disconnect();
    }
  });

  return io;
};