import { createClient } from 'redis';
import { env } from './config/env';

const useTLS = env.REDIS_USE_TLS;

export const redis = createClient({
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  socket: useTLS ? {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    tls: true,
  } : {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

redis.on('error', (err: Error) => console.error('Redis Client Error', err));

// Pub/Sub clients for cross-instance communication
export const pubClient = redis.duplicate();
export const subClient = redis.duplicate();

let initialized = false;
let pubSubInitialized = false;

export const connectRedis = async (): Promise<void> => {
  if (!initialized) {
    await redis.connect();
    initialized = true;
  }
};

export const connectPubSub = async (): Promise<void> => {
  if (!pubSubInitialized) {
    await pubClient.connect();
    await subClient.connect();
    pubSubInitialized = true;
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