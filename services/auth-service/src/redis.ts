import { createClient } from 'redis';

export const redis = createClient({
  username: process.env.REDIS_USERNAME || '',
  password: process.env.REDIS_PASSWORD || '',
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 12115,
    tls: false,
  },
});

redis.on('error', (err) => console.error('Redis Client Error', err));

let initialized = false;
export const connectRedis = async () => {
  if (!initialized) {
    await redis.connect();
    initialized = true;
  }
};

// Session helpers (keyed by JWT jti)
const sessionKey = (jti: string) => `auth:session:${jti}`;
const blacklistKey = (jti: string) => `auth:blacklist:${jti}`;

export const setSession = async (jti: string, data: any, ttlSec: number) => {
  await connectRedis();
  await redis.set(sessionKey(jti), JSON.stringify(data), { EX: Math.max(ttlSec - 30, 1) }); // skew-safe
};

export const getSession = async <T = any>(jti: string): Promise<T | null> => {
  await connectRedis();
  const raw = await redis.get(sessionKey(jti));
  return raw ? JSON.parse(raw) as T : null;
};

export const delSession = async (jti: string) => {
  await connectRedis();
  await redis.del(sessionKey(jti));
};

export const blacklist = async (jti: string, ttlSec: number) => {
  await connectRedis();
  await redis.set(blacklistKey(jti), '1', { EX: ttlSec });
};

export const isBlacklisted = async (jti: string): Promise<boolean> => {
  await connectRedis();
  const exists = await redis.exists(blacklistKey(jti));
  return exists === 1;
};
