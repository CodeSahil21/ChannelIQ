import prisma from "../db";

export const handleUserLoggedInEvent = async (userId: number): Promise<void> => {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { 
                isOnline: true,
                lastSeen: new Date() // Update last seen when logging in
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
        await prisma.user.update({
            where: { id: userId },
            data: { 
                isOnline: false,
                lastSeen: new Date() // Update last seen when logging out
            },
        });
        console.log(`🔴 User ${userId} status updated to offline`);
    } catch (error) {
        console.error(`❌ Failed to update offline status for user ${userId}:`, error);
        throw error;
    }
};

