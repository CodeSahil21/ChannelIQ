import { createClient } from 'redis';
import { env } from './config/env';

export const redis = createClient({
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  socket: env.REDIS_USE_TLS ? {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    tls: true,
  } : {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
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

// Session helpers (keyed by JWT jti)
const sessionKey = (jti: string) => `auth:session:${jti}`;
const blacklistKey = (jti: string) => `auth:blacklist:${jti}`;

export const setSession = async (jti: string, data: Record<string, unknown>, ttlSec: number): Promise<void> => {
  await connectRedis();
  await redis.set(sessionKey(jti), JSON.stringify(data), { EX: Math.max(ttlSec - 30, 1) }); // skew-safe
};

export const getSession = async <T = any>(jti: string): Promise<T | null> => {
  await connectRedis();
  const raw = await redis.get(sessionKey(jti));
  return raw ? JSON.parse(raw) as T : null;
};

export const delSession = async (jti: string): Promise<void> => {
  await connectRedis();
  await redis.del(sessionKey(jti));
};

export const blacklist = async (jti: string, ttlSec: number): Promise<void> => {
  await connectRedis();
  await redis.set(blacklistKey(jti), '1', { EX: ttlSec });
};

export const isBlacklisted = async (jti: string): Promise<boolean> => {
  await connectRedis();
  const exists = await redis.exists(blacklistKey(jti));
  return exists === 1;
};
