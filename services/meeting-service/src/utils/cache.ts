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
}

export const CacheKeys = {
  meeting: (meetingId: string) => `meeting:${meetingId}`,
  meetingUser: (userId: number) => `meeting_user:${userId}`,
  meetingParticipants: (meetingId: string) => `meeting:${meetingId}:participants`,
  liveKitToken: (meetingId: string, userId: number) => `livekit:${meetingId}:${userId}`,
};