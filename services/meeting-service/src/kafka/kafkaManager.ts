import { Kafka, Producer, Admin, Partitioners, Consumer} from "kafkajs";
import { env } from '../config/env';

process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: [env.KAFKA_BROKER],
  retry: {
    initialRetryTime: 100,
    retries: 3,
    maxRetryTime: 25000,
    factor: 2,
    multiplier: 1.5,
    restartOnFailure: async (error) => {
      console.error("Restarting Kafka due to error:", error);
      return true;
    },
  },
  requestTimeout: 25000,
  connectionTimeout: 8000,
  enforceRequestTimeout: true,
});

const IDMPOTENT_ENABLED = (process.env.KAFKA_IDEMPOTENT || 'false').toLowerCase() === 'true';

export const kafkaProducer: Producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
  maxInFlightRequests: 3, 
  idempotent: IDMPOTENT_ENABLED,
  transactionTimeout: 25000, 
  allowAutoTopicCreation: false,
  retry: {
    initialRetryTime: 100,
    retries: 3, 
    maxRetryTime: 25000, 
  },
});

export const kafkaConsumer: Consumer = kafka.consumer({
  groupId: env.KAFKA_CONSUMER_GROUP_ID,
  sessionTimeout: 25000,
  rebalanceTimeout: 50000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1024 * 1024,
  minBytes: 1,
  maxBytes: 1024 * 1024 * 5,
  maxWaitTimeInMs: 100,
  retry: {
    initialRetryTime: 100,
    retries: 3,
    maxRetryTime: 25000,
    restartOnFailure: async (err) => {
      console.error('Consumer restart on failure:', err);
      return true;
    }
  },
  allowAutoTopicCreation: false,
});

const kafkaAdmin: Admin = kafka.admin({
  retry: {
    initialRetryTime: 100,
    retries: 5,
    maxRetryTime: 30000,
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
        topic: 'meeting-events',
        numPartitions: parseInt(process.env.KAFKA_MEETING_EVENTS_PARTITIONS || "4"),
        replicationFactor,
        configEntries: [
          { name: 'retention.ms', value: '604800000' },
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'compression.type', value: 'gzip' }, 
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

let isKafkaInitialized = false;

export const initializeKafka = async (): Promise<void> => {
  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
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

    } catch (error) {
      retryCount++;
      console.error(`❌ Kafka initialization failed (Attempt ${retryCount}/${maxRetries}):`, error);

      if (retryCount >= maxRetries) {
        console.error('❌ Max Kafka initialization retries exceeded');
        throw new Error(`Failed to initialize Kafka after ${maxRetries} attempts: ${error}`);
      }

      const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

export const disconnectKafka = async (): Promise<void> => {
  try {
    if (!isKafkaInitialized) {
      console.log('ℹ️ Kafka not initialized or already disconnected - skipping disconnect');
      return;
    }

    console.log("🛑 Disconnecting from Kafka...");

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

  } catch (error) {
    console.error("❌ Error disconnecting from Kafka:", error);
  }
};