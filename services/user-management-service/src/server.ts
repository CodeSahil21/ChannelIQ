import http from 'http';
import app from './app';
import { initializeKafka,disconnectKafka } from './kafka/kafkaManager';
import { startConsumer } from './kafka/consumer';
import { env } from './config/env';
import logger from './utils/logger';

const server = http.createServer(app);

//Add kafka intialization 
const startServer = async()=>{
  try{
    await initializeKafka();
    logger.info('Kafka initialized successfully');

  await startConsumer();
    logger.info('Consumer initialized successfully');

    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });

  }catch(error){
    logger.error('Failed to initialize Kafka', { error });
    process.exit(1);
  }
}


//graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Gracefully shutting down...');
  server.close(() => {
    logger.info('HTTP server closed');
  });
  await disconnectKafka();
  process.exit(0);
});

startServer();