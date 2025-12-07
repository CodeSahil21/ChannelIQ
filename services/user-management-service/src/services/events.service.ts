import prisma from "../db";

export const handleUserLoggedInEvent = async (userId: number): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
        });
        
        if (!user) {
            console.warn(`⚠️ User ${userId} not found, skipping online status update`);
            return;
        }
        
        await prisma.user.update({
            where: { id: userId },
            data: { 
                isOnline: true,
                lastSeen: new Date()
            },
        });
        console.log(`🟢 User ${userId} status updated to online`);
    } catch (error) {
        console.error(`❌ Failed to update online status for user ${userId}:`, error);
        throw error;
    }
};

export const handleUserLoggedOutEvent = async (userId: number): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
        });
        
        if (!user) {
            console.warn(`⚠️ User ${userId} not found, skipping offline status update`);
            return;
        }
        
        await prisma.user.update({
            where: { id: userId },
            data: { 
                isOnline: false,
                lastSeen: new Date()
            },
        });
        console.log(`🔴 User ${userId} status updated to offline`);
    } catch (error) {
        console.error(`❌ Failed to update offline status for user ${userId}:`, error);
        throw error;
    }
};

