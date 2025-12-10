import { createClient } from 'redis';

const useTLS = process.env.REDIS_USE_TLS === 'true';

export const redis = createClient({
  username: process.env.REDIS_USERNAME || '',
  password: process.env.REDIS_PASSWORD || '',
  socket: useTLS ? {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    tls: true,
  } : {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  },
});

redis.on('error', (err) => console.error('Redis Client Error', err));

let initialized = false;
export const connectRedis = async (): Promise<void> => {
  if (!initialized) {
    await redis.connect();
    initialized = true;
  }
};

const sessionKey = (jti: string) => `auth:session:${jti}`;
const blacklistKey = (jti: string) => `auth:blacklist:${jti}`;

export const getSession = async <T = any>(jti: string): Promise<T | null> => {
  await connectRedis();
  const raw = await redis.get(sessionKey(jti));
  return raw ? JSON.parse(raw) as T : null;
};

export const isBlacklisted = async (jti: string): Promise<boolean> => {
  await connectRedis();
  const exists = await redis.exists(blacklistKey(jti));
  return exists === 1;
};