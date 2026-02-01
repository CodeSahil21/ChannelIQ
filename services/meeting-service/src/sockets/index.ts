import { Server } from 'socket.io';
import http from 'http';
import { TypedServer } from './types';
import { verifySocketAuth } from './middleware';
import { registerMeetingHandlers } from './meetingHandlers';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient, connectPubSub } from '../redis';
import { activeConnections } from '../utils/metrics';
import logger from '../utils/logger';


export const initMeetingSocket = (server: http.Server): TypedServer => {
  const io: TypedServer = new Server(server, {
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    path: '/meeting-socket/',
    cors: {
      origin: true,
      credentials: true
    }
  });

  // Initialize Redis pub/sub connections and adapter
  const initializeRedis = async () => {
    try {
      await connectPubSub();
      io.adapter(createAdapter(pubClient, subClient));
      
      logger.info('Meeting Redis adapter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Meeting Redis', { error });
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

      // Track active WebSocket connections
      activeConnections.inc();
      logger.info('Meeting socket connected', { userId: socket.data.user.id });

      socket.join(`user:${socket.data.user.id}`);
      registerMeetingHandlers(io, socket);

      socket.on('disconnect', () => {
        activeConnections.dec();
        logger.info('Meeting socket disconnected', { userId: socket.data.user?.id });
      });
    } catch (error) {
      logger.error('Meeting socket connection error', { error, userId: socket.data.user?.id });
      socket.disconnect();
    }
  });

  return io;
};