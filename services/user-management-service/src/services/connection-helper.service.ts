import prisma from '../db/index';
import { deleteMultipleCache } from '../utils/cache';

/**
 * Soft delete a connection with cache invalidation
 * @param connectionId The connection ID to delete
 * @param userId The user ID requesting the deletion
 */
export const softDeleteConnection = async (
    connectionId: number, 
    userId: number
): Promise<void> => {
    // Find the connection first to validate it
    const connection = await prisma.connection.findUnique({
        where: { id: connectionId }
    });

    if (!connection) {
        throw new Error("Connection not found");
    }

    // Make sure the user is a participant in the connection
    if (connection.senderId !== userId && connection.receiverId !== userId) {
        throw new Error("You are not authorized to delete this connection");
    }
    
    const otherUserId = connection.senderId === userId ? connection.receiverId : connection.senderId;
    
    // Soft delete the connection
    await prisma.connection.update({
        where: { id: connectionId },
        data: {
            isDeleted: true,
            deletedAt: new Date()
        }
    });

    // Invalidate caches for both users
    await deleteMultipleCache([
        `user:connections:${userId}`,
        `user:connections:${otherUserId}`,
        `user:connection-stats:${userId}`,
        `user:connection-stats:${otherUserId}`,
        `connection:status:${userId}:${otherUserId}`,
        `connection:status:${otherUserId}:${userId}`
    ]);
};