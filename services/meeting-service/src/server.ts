import app from './app';
import { connectDb, disconnectDb } from './config/db';
import { connectRedis } from './redis';
import { initializeKafka, disconnectKafka } from './kafka/kafkaManager';
import { env } from './config/env';

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

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Meeting service running on port ${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          await disconnectKafka();
          await disconnectDb();
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