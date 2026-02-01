import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3003').transform(val => parseInt(val)),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  LIVEKIT_WS_URL: z.string().default('ws://localhost:7880'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(val => parseInt(val)),
  REDIS_USERNAME: z.string().default(''),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_USE_TLS: z.string().default('false').transform(val => val === 'true'),
  KAFKA_CLIENT_ID: z.string().default('meeting-service'),
  KAFKA_BROKER: z.string().default('kafka-9c33e1e-haluk7862-58ab.g.aivencloud.com:18242'),
  KAFKA_CONSUMER_GROUP_ID: z.string().default('meeting-service-group'),
  KAFKA_USE_SSL: z.string().default('true').transform(val => val === 'true'),
  KAFKA_SSL_CA_PATH: z.string().default('../../certs/ca.pem'),
  KAFKA_USERNAME: z.string().optional(),
  KAFKA_PASSWORD: z.string().optional(),
  KAFKA_CREATE_TOPICS: z.string().default('false'),
  KAFKA_MEDIA_EVENTS_PARTITIONS: z.string().default('1').transform(val => parseInt(val)),
  KAFKA_REPLICATION_FACTOR: z.string().default('3').transform(val => parseInt(val)),
  FRONTEND_URLS: z.string().default('http://localhost:3000').transform(val => val.split(',')),
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOKI_HOST: z.string().default('http://localhost:3100'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}
console.log('Environment variables loaded successfully', parsed.data);
export const env = parsed.data;

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 120,
  MEDIUM: 600,
  LONG: 1800,
  MEETING: 300,
  TOKEN: 60,
};