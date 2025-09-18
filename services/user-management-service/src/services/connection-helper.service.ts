import prisma from '../db/index';
import { ActivityType } from '../utils/prismaTypes';
import { logUserActivity } from './activity.service';

/**
 * Soft delete a connection with activity logging
 * @param connectionId The connection ID to delete
 * @param userId The user ID requesting the deletion
 * @param userAgent Optional user agent string
 * @param ipAddress Optional IP address
 */
export const softDeleteConnection = async (
    connectionId: number, 
    userId: number,
    userAgent?: string,
    ipAddress?: string
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
    
    // Soft delete the connection
    await prisma.connection.update({
        where: { id: connectionId },
        data: {
            isDeleted: true,
            deletedAt: new Date()
            // deletedBy field is not present in the schema
        }
    });

    // Log the activity
    const otherUserId = connection.senderId === userId ? connection.receiverId : connection.senderId;
    
    await logUserActivity(
        userId,
        ActivityType.CONNECTION_REMOVED,
        'Connection removed',
        { connectionId, otherUserId },
        ipAddress,
        userAgent
    );
};