import { createClient } from 'redis';
import { config } from './utils/config';

const useTLS = config.REDIS_USE_TLS;

export const redis = createClient({
  username: config.REDIS_USERNAME,
  password: config.REDIS_PASSWORD,
  socket: useTLS ? {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    tls: true,
  } : {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
  },
});

redis.on('error', (err: Error) => console.error('Redis Client Error', err));

let initialized = false;
export const connectRedis = async (): Promise<void> => {
  if (!initialized) {
    await redis.connect();
    initialized = true;
  }
};

const sessionKey = (jti: string) => `auth:session:${jti}`;
const blacklistKey = (jti: string) => `auth:blacklist:${jti}`;

const ensureRedis = async (): Promise<void> => {
  if (!redis.isOpen) {
    await connectRedis();
  }
};

export const getAuthState = async <TSession = any>(
  jti: string
): Promise<{ blacklisted: boolean; session: TSession | null }> => {
  await ensureRedis();

  const res = await redis.multi().exists(blacklistKey(jti)).get(sessionKey(jti)).exec();
  const existsVal = (res?.[0] as unknown as number) ?? 0;
  const rawSession = (res?.[1] as unknown as string | null) ?? null;

  return {
    blacklisted: existsVal === 1,
    session: rawSession ? (JSON.parse(rawSession) as TSession) : null,
  };
};

export const getSession = async <T = any>(jti: string): Promise<T | null> => {
  await ensureRedis();
  const raw = await redis.get(sessionKey(jti));
  return raw ? JSON.parse(raw) as T : null;
};

export const isBlacklisted = async (jti: string): Promise<boolean> => {
  await ensureRedis();
  const exists = await redis.exists(blacklistKey(jti));
  return exists === 1;
};