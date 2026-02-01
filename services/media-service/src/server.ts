import http from 'http';
import app from './app';
import { initializeKafka, disconnectKafka } from './kafka/kafkaManager';
import { startConsumer } from './kafka/consumer';
import logger from './utils/logger';

const PORT = process.env.PORT || 3003;

const server = http.createServer(app);

const startServer = async () => {
  try {
    await initializeKafka();
    logger.info('Kafka initialized successfully');

    await startConsumer();
    logger.info('Consumer initialized successfully');

    server.listen(PORT, () => {
      logger.info(`Media Service running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to initialize Kafka', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Gracefully shutting down...');
  await disconnectKafka();
  process.exit(0);
});

startServer();