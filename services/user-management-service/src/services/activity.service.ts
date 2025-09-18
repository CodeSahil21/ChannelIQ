import prisma from '../db/index';
import { ActivityType } from '../utils/prismaTypes';

/**
 * Service for logging user activities
 */
export const logUserActivity = async (
    userId: number, 
    type: ActivityType, 
    description?: string, 
    metadata?: any, 
    ipAddress?: string, 
    userAgent?: string
) => {
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
    } catch (error) {
        console.error(`Error logging user activity: ${error}`);
        // Don't throw the error as logging should not break the main flow
    }
};

/**
 * Get activities for a specific user
 */
export const getUserActivities = async (userId: number, limit: number = 20, offset: number = 0) => {
    return await prisma.userActivity.findMany({
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
};

/**
 * Get activities by type
 */
export const getActivitiesByType = async (type: ActivityType, limit: number = 20, offset: number = 0) => {
    return await prisma.userActivity.findMany({
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
};

/**
 * Soft delete an activity
 */
export const softDeleteActivity = async (id: number) => {
    await prisma.userActivity.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date()
        }
    });
};