import app from './app';
import { connectDb, disconnectDb } from './config/db';
import { connectRedis, redis, pubClient, subClient } from './redis';
import { initializeKafka, disconnectKafka } from './kafka/kafkaManager';
import { env } from './config/env';
import { createServer } from 'http';
import { initMeetingSocket } from './sockets';
import { setMeetingSocketServer } from './services/meetingSocket.service';
import logger from './utils/logger';

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Initialize Database
    logger.info('Connecting to Database...');
    await connectDb();
    logger.info('Database connected successfully');

    // Initialize Redis
    logger.info('Connecting to Redis...');
    await connectRedis();
    logger.info('Redis connected successfully');

    // Initialize Kafka
    logger.info('Initializing Kafka...');
    await initializeKafka();
    logger.info('Kafka initialized successfully');
    
    // Create HTTP server and initialize Socket.IO
    const server = createServer(app);
    const io = initMeetingSocket(server);
    setMeetingSocketServer(io);
    
    server.listen(PORT, () => {
      logger.info(`Meeting service running on port ${PORT}`);
      logger.info('Meeting Socket.IO server initialized');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await disconnectKafka();
          await disconnectDb();
          
          // Close Redis connections
          if (redis.isOpen) await redis.quit();
          if (pubClient.isOpen) await pubClient.quit();
          if (subClient.isOpen) await subClient.quit();
          
          logger.info('All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();