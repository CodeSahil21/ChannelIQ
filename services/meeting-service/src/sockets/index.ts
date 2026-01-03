import { Server } from 'socket.io';
import http from 'http';
import { TypedServer } from './types';
import { verifySocketAuth } from './middleware';
import { registerMeetingHandlers } from './meetingHandlers';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient, connectPubSub } from '../redis';
import { env } from '../config/env';

export const initMeetingSocket = (server: http.Server): TypedServer => {
  const corsOrigins = process.env.NODE_ENV === 'production' 
    ? env.FRONTEND_URLS
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
    transports: ['websocket', 'polling'],
    path: '/meeting-socket/'
  });

  // Initialize Redis pub/sub connections and adapter
  const initializeRedis = async () => {
    try {
      await connectPubSub();
      
      // Set up Socket.io Redis adapter for cross-instance room management
      // This automatically handles cross-instance communication without duplicates
      io.adapter(createAdapter(pubClient, subClient));
      
      console.log('Meeting Redis adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Meeting Redis:', error);
      // Continue without Redis adapter - single instance mode
    }
  };

  // Initialize Redis in background
  initializeRedis();

  io.use(verifySocketAuth);

  io.on('connection', async (socket) => {
    try {
      const userId = socket.data.user?.id?.toString().replace(/[\x00-\x1F\x7F\r\n]/g, '') || 'Unknown';
      // console.log('Meeting socket connected:', userId);
      
      if (!socket.data.user?.id) {
        socket.disconnect();
        return;
      }

      socket.join(`user:${socket.data.user.id}`);
      registerMeetingHandlers(io, socket);
    } catch (error) {
      console.error('Meeting socket connection error:', error);
      socket.disconnect();
    }
  });

  return io;
};