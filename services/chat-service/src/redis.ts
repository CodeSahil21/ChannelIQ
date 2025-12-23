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

// Generic cache functions for middleware
export const getCache = async <T = any>(key: string): Promise<T | null> => {
  await connectRedis();
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) as T : null;
};

export const setCache = async (key: string, value: any, ttlSeconds: number): Promise<void> => {
  await connectRedis();
  if (value === null || ttlSeconds === 0) {
    await redis.del(key); // Delete if null or ttl is 0
  } else {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  await connectRedis();
  await redis.del(key);
};

export const deleteMultipleCache = async (keys: string[]): Promise<void> => {
  await connectRedis();
  if (keys.length > 0) {
    await redis.del(keys);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  await connectRedis();
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
};

export const deleteCachePatterns = async (patterns: string[]): Promise<void> => {
  await connectRedis();
  const allKeys: string[] = [];
  
  // Batch all pattern matches
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    allKeys.push(...keys);
  }
  
  // Single delete operation
  if (allKeys.length > 0) {
    await redis.del(allKeys);
  }
};

// Cache keys
export const CacheKeys = {
  group: (groupId: string) => `chat:group:${groupId}`,
  groupMembers: (groupId: string) => `chat:members:${groupId}`,
  userGroups: (userId: number) => `chat:user:${userId}:groups`,
  pendingRequests: (userId: number) => `chat:user:${userId}:requests`,
  pinnedMessages: (groupId: string) => `chat:pinned:${groupId}`,
  groupSearch: (query: string, page: number) => `chat:search:${query}:${page}`,
};

// TTL constants (optimized for performance)
export const CacheTTL = {
  SHORT: 60,    // 1min for frequently changing data
  MEDIUM: 300,  // 5min for group details
  LONG: 900,    // 15min for user groups
  SEARCH: 180,  // 3min for search results
};