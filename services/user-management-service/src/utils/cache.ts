import { redis, connectRedis } from '../redis';

export const getCache = async <T = any>(key: string): Promise<T | null> => {
  try {
    await connectRedis();
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
};

export const setCache = async (key: string, value: any, ttl: number): Promise<void> => {
  try {
    await connectRedis();
    await redis.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await connectRedis();
    await redis.del(key);
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
  }
};

export const deleteMultipleCache = async (keys: string[]): Promise<void> => {
  try {
    await connectRedis();
    if (keys.length > 0) {
      // Batch delete all keys in single operation
      await redis.del(keys);
    }
  } catch (error) {
    console.error(`Cache delete multiple error:`, error);
  }
};

export const deleteCachePatterns = async (patterns: string[]): Promise<void> => {
  try {
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
  } catch (error) {
    console.error(`Cache delete patterns error:`, error);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    await connectRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error(`Cache delete pattern error for ${pattern}:`, error);
  }
};
