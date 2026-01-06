import { Kafka, Producer, Consumer, Admin, Partitioners } from "kafkajs";
import { env } from "../config/env";
import fs from "fs";
import path from "path";

process.env.KAFKAJS_NO_PARTITIONER_WARNING = "1";

/* ---------- SSL CONFIG ---------- */
 const getSSLConfig = () => {
   if (!env.KAFKA_USE_SSL) return undefined;

   return {
     rejectUnauthorized: true,
     ca: [fs.readFileSync(path.resolve(env.KAFKA_SSL_CA_PATH), "utf-8")],
   };
 };

/* ---------- SASL CONFIG ---------- */
const getSaslConfig = () => {
  if (!env.KAFKA_USERNAME || !env.KAFKA_PASSWORD) return undefined;

  return {
    mechanism: "scram-sha-512" as const,
    username: env.KAFKA_USERNAME,
    password: env.KAFKA_PASSWORD,
  };
};

/* ---------- KAFKA CLIENT ---------- */
const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: [env.KAFKA_BROKER],
  ssl:getSSLConfig(),
  sasl: getSaslConfig(),
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 300,
    retries: 3,
    maxRetryTime: 25000,
  },
});

/* ---------- PRODUCER ---------- */
export const kafkaProducer: Producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
  idempotent: false,
  maxInFlightRequests: 3,
  allowAutoTopicCreation: false,
});

/* ---------- CONSUMER ---------- */
export const kafkaConsumer: Consumer = kafka.consumer({
  groupId: env.KAFKA_CONSUMER_GROUP_ID,
  sessionTimeout: 25000,
  rebalanceTimeout: 50000,
  heartbeatInterval: 3000,
  allowAutoTopicCreation: false,
});

/* ---------- ADMIN ---------- */
const kafkaAdmin: Admin = kafka.admin();

/* ---------- TOPIC CREATION ---------- */
export const createKafkaTopics = async (): Promise<void> => {
  if (env.KAFKA_CREATE_TOPICS !== "true") {
    console.log("ℹ️ Kafka topic creation disabled");
    return;
  }

  await kafkaAdmin.connect();

  try {
    const existingTopics = await kafkaAdmin.listTopics();
    console.log("Existing Kafka topics:", existingTopics);

    const topics = [
      {
        topic: "user-events",
        numPartitions: env.KAFKA_USER_EVENTS_PARTITIONS,
        replicationFactor: env.KAFKA_REPLICATION_FACTOR,
      },
      {
        topic: "chat-events",
        numPartitions: env.KAFKA_CHAT_EVENTS_PARTITIONS,
        replicationFactor: env.KAFKA_REPLICATION_FACTOR,
      },
      {
        topic: "media-events",
        numPartitions: env.KAFKA_MEDIA_EVENTS_PARTITIONS,
        replicationFactor: env.KAFKA_REPLICATION_FACTOR,
      },
    ];

    const toCreate = topics.filter(
      (t) => !existingTopics.includes(t.topic)
    );

    if (toCreate.length > 0) {
      await kafkaAdmin.createTopics({
        topics: toCreate,
        waitForLeaders: true,
      });

      console.log(
        "✅ Topics created:",
        toCreate.map((t) => t.topic).join(", ")
      );
    } else {
      console.log("📋 All required topics already exist");
    }
  } finally {
    await kafkaAdmin.disconnect();
  }
};



/* ---------- INIT ---------- */
let initialized = false;

export const initializeKafka = async (): Promise<void> => {
  if (initialized) return;

  console.log("🔄 Initializing Kafka (user-management-service)...");

  await createKafkaTopics();

  await kafkaProducer.connect();
  console.log("✅ Kafka producer connected");

  await kafkaConsumer.connect();
  console.log("✅ Kafka consumer connected");

  initialized = true;
  console.log("🚀 Kafka initialized successfully");
};

/* ---------- SHUTDOWN ---------- */
export const disconnectKafka = async (): Promise<void> => {
  if (!initialized) return;

  await kafkaConsumer.disconnect();
  await kafkaProducer.disconnect();

  initialized = false;
  console.log("🛑 Kafka disconnected");
};