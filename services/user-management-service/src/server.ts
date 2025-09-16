import http from 'http';
import app from './app';
import { initializeKafka,disconnectKafka } from './kafka/kafkaManager';
import { startConsumer } from './kafka/consumer';

const PORT = process.env.PORT || 3002;

const server = http.createServer(app);

//Add kafka intialization 
const startServer = async()=>{
  try{
    await initializeKafka();
    console.log("Kafka initialized successfully");

  await startConsumer();
    console.log("Consumer initialized successfully");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  }catch(error){
    console.error("Failed to initialize Kafka", error);
    process.exit(1);
  }
}


//graceful shutdown
process.on('SIGINT', async () => {
  console.log("Gracefully shutting down...");
  await disconnectKafka();
  process.exit(0);
});

startServer();