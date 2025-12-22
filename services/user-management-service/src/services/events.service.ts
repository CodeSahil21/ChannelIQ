import prisma from "../db";
import { getCache, setCache, deleteMultipleCache } from "../utils/cache";

// Get user online status with caching
export const getUserOnlineStatus = async (userId: number): Promise<{ isOnline: boolean; lastSeen: Date | null }> => {
    const cacheKey = `user:online-status:${userId}`;
    
    // Try cache first
    const cached = await getCache<{ isOnline: boolean; lastSeen: Date | null }>(cacheKey);
    if (cached) {
        return cached;
    }
    
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isOnline: true, lastSeen: true }
    });
    
    if (!user) {
        throw new Error('User not found');
    }
    
    const result = {
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
    };
    
    // Cache for 5 minutes
    await setCache(cacheKey, result, 300);
    
    return result;
};

export const handleUserLoggedInEvent = async (userId: number): Promise<void> => {
    try {
        // Check cache first to avoid unnecessary DB queries
        const cacheKey = `user:online:${userId}`;
        const cachedStatus = await getCache<boolean>(cacheKey);
        
        // If already online in cache, skip update
        if (cachedStatus === true) {
            console.log(`🟢 User ${userId} already online (cached)`);
            return;
        }
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isOnline: true }
        });
        
        if (!user) {
            console.warn(`⚠️ User ${userId} not found, skipping online status update`);
            return;
        }
        
        // Only update if not already online
        if (!user.isOnline) {
            await prisma.user.update({
                where: { id: userId },
                data: { 
                    isOnline: true,
                    lastSeen: new Date()
                },
            });
        }
        
        // Cache online status and invalidate profile cache
        await setCache(cacheKey, true, 3600); // 1 hour
        await deleteMultipleCache([
            `user:profile:${userId}`,
            `user:online-status:${userId}`
        ]);
        
        console.log(`🟢 User ${userId} status updated to online`);
    } catch (error) {
        console.error(`❌ Failed to update online status for user ${userId}:`, error);
        throw error;
    }
};

export const handleUserLoggedOutEvent = async (userId: number): Promise<void> => {
    try {
        // Check cache first to avoid unnecessary DB queries
        const cacheKey = `user:online:${userId}`;
        const cachedStatus = await getCache<boolean>(cacheKey);
        
        // If already offline in cache, skip update
        if (cachedStatus === false) {
            console.log(`🔴 User ${userId} already offline (cached)`);
            return;
        }
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isOnline: true }
        });
        
        if (!user) {
            console.warn(`⚠️ User ${userId} not found, skipping offline status update`);
            return;
        }
        
        // Only update if not already offline
        if (user.isOnline) {
            await prisma.user.update({
                where: { id: userId },
                data: { 
                    isOnline: false,
                    lastSeen: new Date()
                },
            });
        }
        
        // Cache offline status and invalidate profile cache
        await setCache(cacheKey, false, 3600); // 1 hour
        await deleteMultipleCache([
            `user:profile:${userId}`,
            `user:online-status:${userId}`
        ]);
        
        console.log(`🔴 User ${userId} status updated to offline`);
    } catch (error) {
        console.error(`❌ Failed to update offline status for user ${userId}:`, error);
        throw error;
    }
};

