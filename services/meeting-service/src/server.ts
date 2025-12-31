import app from './app';
import { connectDb, disconnectDb } from './config/db';
import { connectRedis, redis, pubClient, subClient } from './redis';
import { initializeKafka, disconnectKafka } from './kafka/kafkaManager';
import { env } from './config/env';
import { createServer } from 'http';
import { initMeetingSocket } from './sockets';
import { setMeetingSocketServer } from './services/meetingSocket.service';

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Initialize Database
    console.log('🔗 Connecting to Database...');
    await connectDb();
    console.log('✅ Database connected successfully');

    // Initialize Redis
    console.log('🔗 Connecting to Redis...');
    await connectRedis();
    console.log('✅ Redis connected successfully');

    // Initialize Kafka
    console.log('🔗 Initializing Kafka...');
    await initializeKafka();
    console.log('✅ Kafka initialized successfully');

    // Create HTTP server and initialize Socket.IO
    const server = createServer(app);
    const io = initMeetingSocket(server);
    setMeetingSocketServer(io);
    
    server.listen(PORT, () => {
      console.log(`🚀 Meeting service running on port ${PORT}`);
      console.log(`📡 Meeting Socket.IO server initialized`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await disconnectKafka();
          await disconnectDb();
          
          // Close Redis connections
          if (redis.isOpen) await redis.quit();
          if (pubClient.isOpen) await pubClient.quit();
          if (subClient.isOpen) await subClient.quit();
          
          console.log('All connections closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();