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

const ensureRedis = async (): Promise<void> => {
  if (!redis.isOpen) {
    await connectRedis();
  }
};

// ✅ 1 RTT instead of (exists + get) = 2 RTT
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

// Generic cache functions for middleware
export const getCache = async <T = any>(key: string): Promise<T | null> => {
  await ensureRedis();
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) as T : null;
};

export const setCache = async (key: string, value: any, ttlSeconds: number): Promise<void> => {
  await ensureRedis();
  if (value === null || ttlSeconds === 0) {
    await redis.del(key);
  } else {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  }
};

export const getCachedGroupIds = async (userId: number): Promise<string[] | null> => {
  return await getCache<string[]>(CacheKeys.socketUserGroups(userId));
};

export const setCachedGroupIds = async (userId: number, groupIds: string[]): Promise<void> => {
  await setCache(CacheKeys.socketUserGroups(userId), groupIds, CacheTTL.SOCKET_GROUPS);
};

export const deleteCache = async (key: string): Promise<void> => {
  await ensureRedis();
  await redis.del(key);
};

export const deleteMultipleCache = async (keys: string[]): Promise<void> => {
  await ensureRedis();
  if (keys.length > 0) {
    await redis.del(keys);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  await ensureRedis();
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
};

export const deleteCachePatterns = async (patterns: string[]): Promise<void> => {
  await ensureRedis();
  const allKeys: string[] = [];
  
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    allKeys.push(...keys);
  }
  
  if (allKeys.length > 0) {
    await redis.del(allKeys);
  }
};

// Cache keys
export const CacheKeys = {
  group: (groupId: string) => `chat:group:${groupId}`,
  groupMembers: (groupId: string) => `chat:members:${groupId}`,
  userGroups: (userId: number) => `chat:user:${userId}:groups`,
  socketUserGroups: (userId: number) => `chat:socket:user:${userId}:groups`,
  pendingRequests: (userId: number) => `chat:user:${userId}:requests`,
  pinnedMessages: (groupId: string) => `chat:pinned:${groupId}`,
  groupSearch: (query: string, page: number) => `chat:search:${query}:${page}`,
  announcements: (groupId: string) => `chat:announcements:${groupId}`,
  polls: (groupId: string) => `chat:polls:${groupId}`,
};

// TTL constants
export const CacheTTL = {
  SHORT: 120,
  MEDIUM: 600,
  LONG: 1800,
  SEARCH: 300,
  SOCKET_GROUPS: 60,
};