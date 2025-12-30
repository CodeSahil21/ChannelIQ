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
  KAFKA_BROKER: z.string().default('localhost:9092'),
  KAFKA_CONSUMER_GROUP_ID: z.string().default('meeting-service-group'),
  FRONTEND_URLS: z.string().default('http://localhost:3000').transform(val => val.split(',')),
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