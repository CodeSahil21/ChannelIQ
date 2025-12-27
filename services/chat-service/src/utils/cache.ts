import { redis, connectRedis } from '../redis';

export class CacheService {
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      await connectRedis();
      const raw = await redis.get(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await connectRedis();
      if (value === null || ttlSeconds === 0) {
        await redis.del(key);
      } else {
        await redis.setEx(key, ttlSeconds, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await connectRedis();
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async deletePattern(pattern: string): Promise<void> {
    try {
      await connectRedis();
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  static async deletePatterns(patterns: string[]): Promise<void> {
    try {
      await connectRedis();
      const allKeys: string[] = [];
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        allKeys.push(...keys);
      }
      
      if (allKeys.length > 0) {
        await redis.del(allKeys);
      }
    } catch (error) {
      console.error('Cache delete patterns error:', error);
    }
  }
}

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
  chatUser: (userId: number) => `chat_user:${userId}`,
  membership: (userId: number, groupId: string) => `membership:${userId}:${groupId}`,
};