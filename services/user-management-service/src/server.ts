import http from 'http';
import app from './app';
import { initializeKafka,disconnectKafka } from './kafka/kafkaManager';
import { startConsumer } from './kafka/consumer';
import { env } from './config/env';

const server = http.createServer(app);

//Add kafka intialization 
const startServer = async()=>{
  try{
    await initializeKafka();
    console.log("Kafka initialized successfully");

  await startConsumer();
    console.log("Consumer initialized successfully");

    server.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });

  }catch(error){
    console.error("Failed to initialize Kafka", error);
    process.exit(1);
  }
}


//graceful shutdown
process.on('SIGINT', async () => {
  console.log("Gracefully shutting down...");
  server.close(() => {
    console.log("HTTP server closed");
  });
  await disconnectKafka();
  process.exit(0);
});

startServer();