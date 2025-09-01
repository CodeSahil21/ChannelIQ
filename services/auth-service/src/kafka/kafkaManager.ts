import { Kafka, Producer, Admin, Partitioners,Consumer } from "kafkajs";

// Add this line to silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "auth-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  retry: {
    initialRetryTime: parseInt(process.env.KAFKA_RETRY_INITIAL || "100"),
    retries: parseInt(process.env.KAFKA_RETRY_COUNT || "8"),
    // Add these for better retry handling
    maxRetryTime: parseInt(process.env.KAFKA_MAX_RETRY_TIME || "30000"),
    factor: 2,
    multiplier: 1.5,
    restartOnFailure: async (err) => {
      console.error('Kafka client restart on failure:', err);
      return true;
    }
  },
  requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || "30000"),
  connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || "10000"),
  
  // Add this to prevent hanging requests
  enforceRequestTimeout: true,
});

// create producer instance
export const kafkaProducer: Producer = kafka.producer({
  // Add legacy partitioner to fix the warning
  createPartitioner: Partitioners.LegacyPartitioner,
  
  // Your existing settings with improvements
  maxInFlightRequests: 5, // Increased from 1 for better performance
  idempotent: true, // keep for preventing duplicate messages
  transactionTimeout: 30000,
  
  // Add these optimizations
  allowAutoTopicCreation: true,
  retry: {
    initialRetryTime: 100,
    retries: 5,
    maxRetryTime: 30000,
  },
});

export const kafkaConsumer: Consumer = kafka.consumer({
  groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'auth-service-group',
  sessionTimeout: 30000,
  rebalanceTimeout: 60000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1024 * 1024, // 1MB
  minBytes: 1,
  maxBytes: 1024 * 1024 * 5, // 5MB
  maxWaitTimeInMs: 5000,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    restartOnFailure: async (err) => {
      console.error('Consumer restart on failure:', err);
      return true;
    }
  },
  allowAutoTopicCreation: true,
});

const kafkaAdmin: Admin = kafka.admin({
  // Removed unsupported timeout configuration
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
  }
});

//create required topics
export const createKafkaTopics = async (): Promise<void> => {
  try {
    console.log("Creating Kafka topics...");
    await kafkaAdmin.connect();

    //check existing topics
    const existingTopics = await kafkaAdmin.listTopics();
    console.log("Existing Kafka topics:", existingTopics);

    const topicsToCreate = [
      {
        topic: 'user-events',
        numPartitions: parseInt(process.env.KAFKA_USER_EVENTS_PARTITIONS || "6"), // Increased for better performance
        replicationFactor: parseInt(process.env.KAFKA_REPLICATION_FACTOR || "1"),
        configEntries: [
          // Your existing configs
          { name: 'retention.ms', value: '604800000' }, // 7 days
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'compression.type', value: 'snappy' },
          // Add these for better performance
          { name: 'segment.ms', value: '86400000' }, // 1 day segments
          { name: 'min.insync.replicas', value: '1' },
          { name: 'unclean.leader.election.enable', value: 'false' },
          { name: 'max.message.bytes', value: '1048576' }, // 1MB max message
          { name: 'segment.bytes', value: '104857600' }, // 100MB segments
        ]
      },
       {
    // ✅ Auth service CONSUMES from user-management-events
    topic: 'user-management-events',
    numPartitions: parseInt(process.env.KAFKA_USER_MANAGEMENT_EVENTS_PARTITIONS || "4"),
    replicationFactor: parseInt(process.env.KAFKA_REPLICATION_FACTOR || "1"),
    configEntries: [
      { name: 'retention.ms', value: '604800000' }, // 7 days
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'compression.type', value: 'snappy' },
    ]
  }    
    ];

    const newTopics = topicsToCreate.filter(t => !existingTopics.includes(t.topic));

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

// Initialize kafka connection with retry logic
export const initializeKafka = async (): Promise<void> => {
  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`🔄 Initializing Kafka... (Attempt ${retryCount + 1}/${maxRetries})`);
      
      // Step 1: Create topics first
      await createKafkaTopics();
      
      // Step 2: Connect producer with timeout
      console.log("🔗 Connecting Kafka producer...");
      await Promise.race([
        kafkaProducer.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Producer connection timeout')), 15000)
        )
      ]);
      console.log("✅ Kafka producer connected successfully");

            // Step 2.5: Connect consumer with timeout
      console.log("🔗 Connecting Kafka consumer...");
      await Promise.race([
        kafkaConsumer.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Consumer connection timeout')), 15000)
        )
      ]);
      console.log("✅ Kafka consumer connected successfully");
      
      // Step 3: Test connectivity
      await testKafkaConnectivity();
      console.log("✅ Kafka connectivity verified");
      
      console.log("🚀 Kafka initialized successfully");
      return;

    } catch (error) {
      retryCount++;
      console.error(`❌ Kafka initialization attempt ${retryCount} failed:`, error);
      
      if (retryCount >= maxRetries) {
        console.error('❌ Max Kafka initialization retries exceeded');
        throw new Error(`Failed to initialize Kafka after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retry with exponential backoff
      const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Add connectivity test function
const testKafkaConnectivity = async (): Promise<void> => {
  try {
    await kafkaProducer.send({
      topic: 'user-events',
      messages: [{
        key: 'health-check',
        value: JSON.stringify({ 
          type: 'HEALTH_CHECK', 
          timestamp: new Date().toISOString(),
          service: process.env.SERVICE_ID || 'auth-service'
        })
      }]
    });
  } catch (error) {
    throw new Error(`Kafka connectivity test failed: ${error}`);
  }
};

// Enhanced disconnect function
export const disconnectKafka = async (): Promise<void> => {
  try {
    console.log("🛑 Disconnecting from Kafka...");
    
    // Disconnect producer with timeout
    await Promise.race([
      kafkaProducer.disconnect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Producer disconnect timeout')), 5000)
      )
    ]);
    
    console.log("✅ Kafka producer disconnected successfully");

    // Disconnect consumer with timeout
    await Promise.race([
      kafkaConsumer.disconnect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Consumer disconnect timeout')), 5000)
      )
    ]);
    console.log("✅ Kafka consumer disconnected successfully");

  } catch (error) {
    console.error("❌ Error disconnecting from Kafka:", error);
  }
};

// Enhanced health check
export const isKafkaHealthy = async (): Promise<boolean> => {
  try {
    const admin = kafka.admin();
    await admin.connect();
    
    // Check topics and cluster info
    const topics = await admin.listTopics();
    const brokers = await admin.describeCluster();
    
    await admin.disconnect();
    
    console.log(`✅ Kafka health check passed - Brokers: ${brokers.brokers.length}, Topics: ${topics.length}`);
    return true;
    
  } catch (error) {
    console.error("❌ Kafka health check failed:", error);
    return false;
  }
};

// Add graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down Kafka gracefully...');
  await disconnectKafka();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down Kafka gracefully...');
  await disconnectKafka();
  process.exit(0);
});