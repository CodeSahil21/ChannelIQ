import prisma from '../db/index';
import { ActivityType } from '../utils/prismaTypes';
import { getCache, setCache, deleteCachePattern } from '../utils/cache';

/**
 * Service for logging user activities
 */
export const logUserActivity = async (
    userId: number, 
    type: ActivityType, 
    description?: string, 
    metadata?: Record<string, unknown>, 
    ipAddress?: string, 
    userAgent?: string
): Promise<void> => {
    try {
        await prisma.userActivity.create({
            data: {
                userId,
                type,
                description: description || '',
                metadata: metadata ? metadata : {},
                ipAddress: ipAddress || null,
                userAgent: userAgent || null
            }
        });
        
        // Invalidate caches
        await Promise.all([
            deleteCachePattern(`user:activities:${userId}:*`),
            deleteCachePattern(`activities:type:${type}:*`)
        ]);
    } catch (error) {
        console.error(`Error logging user activity: ${error}`);
        // Don't throw the error as logging should not break the main flow
    }
};

/**
 * Get activities for a specific user
 */
export const getUserActivities = async (userId: number, limit: number = 20, offset: number = 0): Promise<unknown[]> => {
    const cacheKey = `user:activities:${userId}:${limit}:${offset}`;
    
    const cached = await getCache<unknown[]>(cacheKey);
    if (cached) {
        return cached;
    }
    
    const activities = await prisma.userActivity.findMany({
        where: {
            userId,
            isDeleted: false
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: limit,
        skip: offset
    });
    
    await setCache(cacheKey, activities, 600); // 10 minutes
    
    return activities;
};

/**
 * Get activities by type
 */
export const getActivitiesByType = async (type: ActivityType, limit: number = 20, offset: number = 0): Promise<unknown[]> => {
    const cacheKey = `activities:type:${type}:${limit}:${offset}`;
    
    const cached = await getCache<unknown[]>(cacheKey);
    if (cached) {
        return cached;
    }
    
    const activities = await prisma.userActivity.findMany({
        where: {
            type: type as any,
            isDeleted: false
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: limit,
        skip: offset
    });
    
    await setCache(cacheKey, activities, 600); // 10 minutes
    
    return activities;
};

/**
 * Soft delete an activity
 */
export const softDeleteActivity = async (id: number): Promise<void> => {
    const activity = await prisma.userActivity.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date()
        },
        select: { userId: true, type: true }
    });
    
    // Invalidate caches
    await Promise.all([
        deleteCachePattern(`user:activities:${activity.userId}:*`),
        deleteCachePattern(`activities:type:${activity.type}:*`)
    ]);
};