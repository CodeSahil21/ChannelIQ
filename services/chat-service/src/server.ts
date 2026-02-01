import http from 'http';
import app from './app';
import { initializeKafka, disconnectKafka } from './kafka/kafkaManager';
import { startConsumer } from './kafka/consumer';
import { connectRedis, redis } from './redis';
import { initSocket } from './socket/SocketServer';
import { setSocketServer } from './socket/emitters';
import { config } from './utils/config';
import { setupGracefulShutdown } from './utils/gracefulShutdown';
import logger from './utils/logger';

const PORT = config.PORT;

const server = http.createServer(app);
const io = initSocket(server);

// Set socket server for controller integration
setSocketServer(io);

// Add kafka and redis initialization 
const startServer = async() => {
  try {
    // Initialize Redis
    await connectRedis();
    logger.info('Redis connected successfully');
    
    await initializeKafka();
    logger.info('Kafka initialized successfully');

    await startConsumer();
    logger.info('Consumer initialized successfully');

    server.listen(PORT, () => {
      logger.info(`Chat Service with Socket.IO running on port ${PORT}`);
      logger.info(`Socket server initialized: ${io.sockets.sockets.size} users connected`);
      logger.info(`Bulk processing: ${config.ENABLE_BULK_MESSAGES ? 'ENABLED' : 'DISABLED'}`);
    });

    // Setup graceful shutdown for message buffer
    setupGracefulShutdown();

  } catch(error) {
    logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
}

// graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Gracefully shutting down...');
  try {
    await disconnectKafka();
    await redis.disconnect();
    logger.info('Services disconnected successfully');
  } catch (error) {
    logger.error('Error during shutdown', { error });
  }
  process.exit(0);
});

startServer();