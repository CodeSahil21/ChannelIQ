import http from 'http';
import app from './app';
import { initializeKafka, disconnectKafka } from './kafka/kafkaManager';
import { startConsumer } from './kafka/consumer';
import { connectRedis, redis } from './redis';
// import { SocketServer } from './socket/SocketServer';

const PORT = process.env.PORT || 3003;

const server = http.createServer(app);
  // const socketServer = new SocketServer(server);

// Add kafka and redis initialization 
const startServer = async() => {
  try {
    // Initialize Redis
    await connectRedis();
    console.log("✅ Redis connected successfully");
    
    await initializeKafka();
    console.log("✅ Kafka initialized successfully");

    await startConsumer();
    console.log("✅ Consumer initialized successfully");

    server.listen(PORT, () => {
      console.log(`🚀 Chat Service with Socket.IO running on port ${PORT}`);
      // console.log(`🔌 Socket server initialized:`, !!socketServer);
    });

  } catch(error) {
    console.error("❌ Failed to initialize services:", error);
    process.exit(1);
  }
}

// graceful shutdown
process.on('SIGINT', async () => {
  console.log("🔄 Gracefully shutting down...");
  try {
    await disconnectKafka();
    await redis.disconnect();
    console.log("✅ Services disconnected successfully");
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
  }
  process.exit(0);
});

startServer();