import { Kafka, Producer, Admin, Partitioners, Consumer } from "kafkajs";

// Add this line to silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "user-management-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  retry: {
    initialRetryTime: parseInt(process.env.KAFKA_RETRY_INITIAL || "100"),
    retries: parseInt(process.env.KAFKA_RETRY_COUNT || "3"), // Reduced from 5
    maxRetryTime: parseInt(process.env.KAFKA_MAX_RETRY_TIME || "25000"), // Reduced
    factor: 2,
    multiplier: 1.5,
    restartOnFailure: async (error) => {
      console.error("Restarting Kafka consumer due to error:", error);
      return true; 
    },
  },
  requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || "25000"), // Reduced
  connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || "8000"), // Reduced
  enforceRequestTimeout: true
});

const IDMPOTENT_ENABLED = (process.env.KAFKA_IDEMPOTENT || 'false').toLowerCase() === 'true';

// ...existing code...
export const kafkaProducer: Producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
  maxInFlightRequests: 3, // Reduced from 5
  idempotent: IDMPOTENT_ENABLED,
  transactionTimeout: 25000, // Reduced
  allowAutoTopicCreation: false,
  retry: {
    initialRetryTime: 100,
    retries: 3, // Reduced from 5
    maxRetryTime: 25000, // Reduced
  }
});

// ...existing code...
export const kafkaConsumer: Consumer = kafka.consumer({
  groupId: process.env.KAFKA_CONSUMER_GROUP_ID || "user-management-service-group",
  sessionTimeout: 25000, // Reduced from 30000
  rebalanceTimeout: 50000, // Reduced from 60000
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1024 * 1024,
  minBytes: 1,
  maxBytes: 1024 * 1024 * 5,
  maxWaitTimeInMs: 100,
  retry: {
    initialRetryTime: 100,
    retries: 3, // Reduced from 8
    maxRetryTime: 25000, // Reduced
    restartOnFailure: async (err) => {
      console.error('Consumer restart on failure:', err);
      return true;
    }
  },
  allowAutoTopicCreation: false,
});

const kafkaAdmin: Admin = kafka.admin({
   retry:{
    initialRetryTime:100,
    retries:5,
    maxRetryTime:30000,
  }
});



export const createKafkaTopics = async (): Promise<void> => {
  try {
    console.log("Creating Kafka topics...");
    await kafkaAdmin.connect();

    const existingTopics = await kafkaAdmin.listTopics();
    console.log("Existing Kafka topics:", existingTopics);

    const replicationFactor = parseInt(process.env.KAFKA_REPLICATION_FACTOR || "1");

    const topicsToCreate = [
      {
        topic: 'user-events',
        numPartitions: parseInt(process.env.KAFKA_USER_EVENTS_PARTITIONS || "6"),
        replicationFactor,
        configEntries: [
          { name: 'retention.ms', value: '604800000' },
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'compression.type', value: 'gzip' },
          { name: 'segment.ms', value: '86400000' },
          { name: 'min.insync.replicas', value: '1' },
          { name: 'unclean.leader.election.enable', value: 'false' },
          { name: 'max.message.bytes', value: '1048576' },
          { name: 'segment.bytes', value: '104857600' },
        ]
      },
      {
        topic: 'user-management-events',
        numPartitions: parseInt(process.env.KAFKA_USER_MANAGEMENT_EVENTS_PARTITIONS || "4"),
        replicationFactor,
        configEntries: [
          { name: 'retention.ms', value: '604800000' },
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'compression.type', value: 'gzip' },
        ]
      },
      {
        topic: 'chat-events',
        numPartitions: parseInt(process.env.KAFKA_CHAT_EVENTS_PARTITIONS || "4"),
        replicationFactor,
        configEntries: [
          { name: 'retention.ms', value: '604800000' },
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'compression.type', value: 'gzip' }, 
        ]
      }
    ];

    const newTopics = topicsToCreate.filter(t => !existingTopics.includes(t.topic));

    if (IDMPOTENT_ENABLED && replicationFactor < 2) {
      console.warn('⚠️ idempotent producer is enabled but replicationFactor < 2. Idempotent producers require proper broker support and replication. Consider setting KAFKA_IDEMPOTENT=false for single-broker dev or increase replication factor in the cluster.');
    }

    if (newTopics.length > 0) {
      await kafkaAdmin.createTopics({
        validateOnly: false,
        waitForLeaders: true,
        timeout: 30000,
        topics: newTopics
      });
      console.log('✅ Topics created:', newTopics.map(t => t.topic).join(', '));
    } else {
      console.log('📋 All required topics already exist');
    }

  } catch (error) {
    console.error('❌ Failed to create topics:', error);
    throw error;
  } finally {
    await kafkaAdmin.disconnect();
  }
};

let isKafkaInitialized = false;

export const initializeKafka = async():Promise<void>=>{
  const maxRetries = 5;
  let   retryCount = 0;

  while(retryCount < maxRetries){
    try{
      console.log(`🔄 Initializing Kafka... (Attempt ${retryCount + 1}/${maxRetries})`);
      await createKafkaTopics();
      
      console.log("🔗 Connecting Kafka producer...");
        await Promise.race([
        kafkaProducer.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Producer connection timeout')), 15000)
        )
      ]);
      console.log("✅ Kafka producer connected successfully");


      console.log("🔗 Connecting Kafka consumer...");
        await Promise.race([
        kafkaConsumer.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Consumer connection timeout')), 15000)
        )
      ]);
      console.log("✅ Kafka consumer connected successfully");

      console.log("🚀 Kafka initialized successfully");

      isKafkaInitialized = true;
      return;
    }catch(error){
      retryCount++;
      console.error(`❌ Kafka initialization failed (Attempt ${retryCount}/${maxRetries}):`, error);

      if(retryCount >= maxRetries){ 
        console.error('❌ Max Kafka initialization retries exceeded');
        throw new Error(`Failed to initialize Kafka after ${maxRetries} attempts: ${error}`);
      }

      // Wait before retry with exponential backoff
      const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}


export const disconnectKafka = async():Promise<void>=>{
  try{
    if(!isKafkaInitialized){
     console.log('ℹ️ Kafka not initialized or already disconnected - skipping disconnect');
     return;
    }

    console.log("🛑 Disconnecting from Kafka...");

    // Disconnect consumer first (stop fetching)
    try {
      await Promise.race([
        kafkaConsumer.disconnect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Consumer disconnect timeout')), 5000)
        )
      ]);
      console.log("✅ Kafka consumer disconnected successfully");
    } catch (err) {
      console.warn("⚠️ Error disconnecting consumer (continuing):", err);
    }

        // Then disconnect producer (flush & close)
    try {
      await Promise.race([
        kafkaProducer.disconnect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Producer disconnect timeout')), 5000)
        )
      ]);
      console.log("✅ Kafka producer disconnected successfully");
    } catch (err) {
      console.warn("⚠️ Error disconnecting producer (continuing):", err);
    }

    isKafkaInitialized = false;
    
  }catch(error){
    console.error("❌ Error disconnecting from Kafka:", error);
  }
}

export const isKafkaHealthy = async():Promise<boolean>=>{
  try{
    const admin = kafka.admin();
    await admin.connect();

    const topics = await admin.listTopics();
    const brokers = await admin.describeCluster();

    await admin.disconnect();
    
    console.log(`✅ Kafka health check passed - Brokers: ${brokers.brokers.length}, Topics: ${topics.length}`);
    return true;
  }catch (error) {
    console.error("❌ Kafka health check failed:", error);
    return false;
  }
}



