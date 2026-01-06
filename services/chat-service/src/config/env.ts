import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3005').transform(val => parseInt(val)),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(val => parseInt(val)),
  REDIS_USERNAME: z.string().default(''),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_USE_TLS: z.string().default('false').transform(val => val === 'true'),
  KAFKA_CLIENT_ID: z.string().default('chat-service'),
  KAFKA_BROKER: z.string().default('kafka-9c33e1e-haluk7862-58ab.g.aivencloud.com:18253'),
  KAFKA_CONSUMER_GROUP_ID: z.string().default('chat-service-group'),
  KAFKA_USE_SSL: z.string().default('true').transform(val => val === 'true'),
  KAFKA_SSL_CA_PATH: z.string().default('../../certs/ca.pem'),
  KAFKA_USERNAME: z.string().optional(),
  KAFKA_PASSWORD: z.string().optional(),
  KAFKA_CREATE_TOPICS: z.string().default('false'),
  KAFKA_USER_EVENTS_PARTITIONS: z.string().default('1').transform(val => parseInt(val)),
  KAFKA_CHAT_EVENTS_PARTITIONS: z.string().default('1').transform(val => parseInt(val)),
  KAFKA_MEDIA_EVENTS_PARTITIONS: z.string().default('1').transform(val => parseInt(val)),
  KAFKA_REPLICATION_FACTOR: z.string().default('3').transform(val => parseInt(val)),
  FRONTEND_URLS: z.string().default('http://localhost:3000').transform(val => val.split(',')),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;