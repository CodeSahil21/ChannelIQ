import prisma from '../db/index';
import {
    ConnectionRequest,
    ConnectionResponse, 
    ConnectionStatus,
    ConnectionStats,
    ConnectedUser
} from '../utils/types';

import { getCache, setCache, deleteMultipleCache } from '../utils/cache';
import { processProfileImages } from './image.service';



export const sendConnectionRequest = async (request: ConnectionRequest): Promise<ConnectionResponse> => {
    const { senderId, receiverId, message } = request;

    if (senderId === receiverId) {
        throw new Error("Cannot send connection request to yourself");
    }

    // Check if both users exist in single query
    const users = await prisma.user.findMany({
        where: { 
            id: { in: [senderId, receiverId] },
            isDeleted: false 
        },
        select: { id: true }
    });

    if (users.length !== 2) {
        throw new Error("One or both users not found");
    }

    // Check for any existing connection (including soft-deleted)
    const existingConnection = await prisma.connection.findFirst({
        where: {
            OR: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }
    });

    if (existingConnection) {
        // If connection exists but is soft-deleted, only allow if user was part of original connection
        if (existingConnection.isDeleted) {
            // Check if current sender was involved in the original connection
            const wasInvolved = (existingConnection.senderId === senderId && existingConnection.receiverId === receiverId) ||
                              (existingConnection.senderId === receiverId && existingConnection.receiverId === senderId);
            
            if (!wasInvolved) {
                throw new Error("Invalid connection reactivation");
            }
            
            const reactivatedConnection = await prisma.connection.update({
                where: { id: existingConnection.id },
                data: {
                    isDeleted: false,
                    deletedAt: null,
                    status: ConnectionStatus.PENDING,
                    message: message ?? null
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            fullName: true,
                            profilePic: true,
                            jobTitle: true,
                            department: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            fullName: true,
                            profilePic: true,
                            jobTitle: true,
                            department: true
                        }
                    }
                }
            });
            
            return {
                id: reactivatedConnection.id,
                senderId: reactivatedConnection.senderId,
                receiverId: reactivatedConnection.receiverId,
                status: reactivatedConnection.status as ConnectionStatus,
                message: reactivatedConnection.message ?? "",
                sender: {
                    id: reactivatedConnection.sender.id,
                    fullName: reactivatedConnection.sender.fullName ?? "",
                    ...(reactivatedConnection.sender.profilePic ? { profilePic: reactivatedConnection.sender.profilePic } : {}),
                    ...(reactivatedConnection.sender.jobTitle ? { jobTitle: reactivatedConnection.sender.jobTitle } : {}),
                    ...(reactivatedConnection.sender.department ? { department: reactivatedConnection.sender.department } : {})
                },
                receiver: {
                    id: reactivatedConnection.receiver.id,
                    fullName: reactivatedConnection.receiver.fullName ?? "",
                    ...(reactivatedConnection.receiver.profilePic ? { profilePic: reactivatedConnection.receiver.profilePic } : {}),
                    ...(reactivatedConnection.receiver.jobTitle ? { jobTitle: reactivatedConnection.receiver.jobTitle } : {}),
                    ...(reactivatedConnection.receiver.department ? { department: reactivatedConnection.receiver.department } : {})
                },
                createdAt: reactivatedConnection.createdAt,
                updatedAt: reactivatedConnection.updatedAt
            };
        }
        
        // If active connection exists, check status
        if (existingConnection.status === ConnectionStatus.BLOCKED) {
            throw new Error("Cannot send connection request to blocked user");
        }
        if (existingConnection.status === ConnectionStatus.PENDING) {
            throw new Error("Connection request already pending");
        }
        if (existingConnection.status === ConnectionStatus.ACCEPTED) {
            throw new Error("Users are already connected");
        }
        if (existingConnection.status === ConnectionStatus.DECLINED) {
            // Only allow original sender to resend declined requests
            if (existingConnection.senderId !== senderId) {
                throw new Error("Connection request was declined");
            }
            // Allow resending by updating the existing declined request
            const reactivatedConnection = await prisma.connection.update({
                where: { id: existingConnection.id },
                data: {
                    status: ConnectionStatus.PENDING,
                    message: message ?? null,
                    senderId,
                    receiverId,
                    updatedAt: new Date()
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            fullName: true,
                            profilePic: true,
                            jobTitle: true,
                            department: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            fullName: true,
                            profilePic: true,
                            jobTitle: true,
                            department: true
                        }
                    }
                }
            });
            
            // Invalidate caches for declined request reactivation
            await deleteMultipleCache([
                `user:sent-requests:${senderId}`,
                `user:pending-requests:${receiverId}`,
                `connection:status:${senderId}:${receiverId}`,
                `connection:status:${receiverId}:${senderId}`
            ]);
            
            return {
                id: reactivatedConnection.id,
                senderId: reactivatedConnection.senderId,
                receiverId: reactivatedConnection.receiverId,
                status: reactivatedConnection.status as ConnectionStatus,
                message: reactivatedConnection.message ?? "",
                sender: {
                    id: reactivatedConnection.sender.id,
                    fullName: reactivatedConnection.sender.fullName ?? "",
                    ...(reactivatedConnection.sender.profilePic ? { profilePic: reactivatedConnection.sender.profilePic } : {}),
                    ...(reactivatedConnection.sender.jobTitle ? { jobTitle: reactivatedConnection.sender.jobTitle } : {}),
                    ...(reactivatedConnection.sender.department ? { department: reactivatedConnection.sender.department } : {})
                },
                receiver: {
                    id: reactivatedConnection.receiver.id,
                    fullName: reactivatedConnection.receiver.fullName ?? "",
                    ...(reactivatedConnection.receiver.profilePic ? { profilePic: reactivatedConnection.receiver.profilePic } : {}),
                    ...(reactivatedConnection.receiver.jobTitle ? { jobTitle: reactivatedConnection.receiver.jobTitle } : {}),
                    ...(reactivatedConnection.receiver.department ? { department: reactivatedConnection.receiver.department } : {})
                },
                createdAt: reactivatedConnection.createdAt,
                updatedAt: reactivatedConnection.updatedAt
            };
        }
    }

    try {
        const connection = await prisma.connection.create({
        data: {
            senderId,
            receiverId,
            message: message ?? null,
            status: ConnectionStatus.PENDING
        },
        include: {
            sender: {
                select: {
                    id: true,
                    fullName: true,
                    profilePic: true,
                    jobTitle: true,
                    department: true
                }
            },
            receiver: {
                select: {
                    id: true,
                    fullName: true,
                    profilePic: true,
                    jobTitle: true,
                    department: true
                }
            }
        }
    });

    // ...existing response mapping code...
    const response: ConnectionResponse = {
        id: connection.id,
        senderId: connection.senderId,
        receiverId: connection.receiverId,
        status: connection.status as ConnectionStatus,
        message: connection.message ?? "",
        sender: {
            id: connection.sender.id,
            fullName: connection.sender.fullName ?? "",
            ...(connection.sender.profilePic !== null && connection.sender.profilePic !== undefined ? { profilePic: connection.sender.profilePic } : {}),
            ...(connection.sender.jobTitle !== null && connection.sender.jobTitle !== undefined ? { jobTitle: connection.sender.jobTitle } : {}),
            ...(connection.sender.department !== null && connection.sender.department !== undefined ? { department: connection.sender.department } : {})
        },
        receiver: {
            id: connection.receiver.id,
            fullName: connection.receiver.fullName ?? "",
            ...(connection.receiver.profilePic !== null && connection.receiver.profilePic !== undefined ? { profilePic: connection.receiver.profilePic } : {}),
            ...(connection.receiver.jobTitle !== null && connection.receiver.jobTitle !== undefined ? { jobTitle: connection.receiver.jobTitle } : {}),
            ...(connection.receiver.department !== null && connection.receiver.department !== undefined ? { department: connection.receiver.department } : {})
        },
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
    };

    // Invalidate caches
    await deleteMultipleCache([
        `user:sent-requests:${senderId}`,
        `user:pending-requests:${receiverId}`,
        `connection:status:${senderId}:${receiverId}`,
        `connection:status:${receiverId}:${senderId}`
    ]);
    
    return response;
    } catch (error: any) {
        console.error('Error creating connection:', error);
        if (error.code?.startsWith('P')) {
            throw new Error('Database error occurred');
        }
        throw error;
    }
}

// Accept connection request
export const acceptConnectionRequest = async (connectionId: number, userId: number): Promise<ConnectionResponse> => {
    // Find and validate connection
    const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
        select: {
            id: true,
            senderId: true,
            receiverId: true,
            status: true
        }
    });

    if (!connection) {
        throw new Error("Connection request not found");
    }

    if (connection.receiverId !== userId) {
        throw new Error("You are not authorized to accept this connection request");
    }

    if (connection.status !== ConnectionStatus.PENDING) {
        throw new Error("Connection request is not pending");
    }

    // Update and fetch in single query
    const updatedConnection = await prisma.connection.update({
        where: { id: connectionId },
        data: { status: ConnectionStatus.ACCEPTED },
        include: {
            sender: {
                select: {
                    id: true,
                    fullName: true,
                    profilePic: true,
                    jobTitle: true,
                    department: true
                }
            },
            receiver: {
                select: {
                    id: true,
                    fullName: true,
                    profilePic: true,
                    jobTitle: true,
                    department: true
                }
            }
        }
    });

    const response: ConnectionResponse = {
        id: updatedConnection.id,
        senderId: updatedConnection.senderId,
        receiverId: updatedConnection.receiverId,
        status: updatedConnection.status as ConnectionStatus,
        message: updatedConnection.message ?? "",
        sender: {
            id: updatedConnection.sender.id,
            fullName: updatedConnection.sender.fullName ?? "",
            ...(updatedConnection.sender.profilePic !== null && updatedConnection.sender.profilePic !== undefined ? { profilePic: updatedConnection.sender.profilePic } : {}),
            ...(updatedConnection.sender.jobTitle !== null && updatedConnection.sender.jobTitle !== undefined ? { jobTitle: updatedConnection.sender.jobTitle } : {}),
            ...(updatedConnection.sender.department !== null && updatedConnection.sender.department !== undefined ? { department: updatedConnection.sender.department } : {})
        },
        receiver: {
            id: updatedConnection.receiver.id,
            fullName: updatedConnection.receiver.fullName ?? "",
            ...(updatedConnection.receiver.profilePic !== null && updatedConnection.receiver.profilePic !== undefined ? { profilePic: updatedConnection.receiver.profilePic } : {}),
            ...(updatedConnection.receiver.jobTitle !== null && updatedConnection.receiver.jobTitle !== undefined ? { jobTitle: updatedConnection.receiver.jobTitle } : {}),
            ...(updatedConnection.receiver.department !== null && updatedConnection.receiver.department !== undefined ? { department: updatedConnection.receiver.department } : {})
        },
        createdAt: updatedConnection.createdAt,
        updatedAt: updatedConnection.updatedAt
    };
    
    // Invalidate caches
    await deleteMultipleCache([
        `user:connections:${connection.senderId}`,
        `user:connections:${connection.receiverId}`,
        `user:pending-requests:${userId}`,
        `user:sent-requests:${connection.senderId}`,
        `user:stats:${connection.senderId}`,
        `user:stats:${connection.receiverId}`,
        `connection:status:${connection.senderId}:${connection.receiverId}`,
        `connection:status:${connection.receiverId}:${connection.senderId}`
    ]);

    return response;
}


export const declineConnectionRequest = async (connectionId: number, userId: number): Promise<ConnectionResponse> => {
    // Find and validate connection
    const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
        select: {
            id: true,
            senderId: true,
            receiverId: true,
            status: true
        }
    });

    if (!connection) {
        throw new Error("Connection request not found");
    }

    if (connection.receiverId !== userId) {
        throw new Error("You are not authorized to accept this connection request");
    }

    if (connection.status !== ConnectionStatus.PENDING) {
        throw new Error("Connection request is not pending");
    }

    // Update and fetch in single query
    const updatedConnection = await prisma.connection.update({
        where: { id: connectionId },
        data: { status: ConnectionStatus.DECLINED },
        include: {
            sender: {
                select: {
                    id: true,
                    fullName: true,
                    profilePic: true,
                    jobTitle: true,
                    department: true
                }
            },
            receiver: {
                select: {
                    id: true,
                    fullName: true,
                    profilePic: true,
                    jobTitle: true,
                    department: true
                }
            }
        }
    });

    const response: ConnectionResponse = {
        id: updatedConnection.id,
        senderId: updatedConnection.senderId,
        receiverId: updatedConnection.receiverId,
        status: updatedConnection.status as ConnectionStatus,
        message: updatedConnection.message ?? "",
        sender: {
            id: updatedConnection.sender.id,
            fullName: updatedConnection.sender.fullName ?? "",
            ...(updatedConnection.sender.profilePic !== null && updatedConnection.sender.profilePic !== undefined ? { profilePic: updatedConnection.sender.profilePic } : {}),
            ...(updatedConnection.sender.jobTitle !== null && updatedConnection.sender.jobTitle !== undefined ? { jobTitle: updatedConnection.sender.jobTitle } : {}),
            ...(updatedConnection.sender.department !== null && updatedConnection.sender.department !== undefined ? { department: updatedConnection.sender.department } : {})
        },
        receiver: {
            id: updatedConnection.receiver.id,
            fullName: updatedConnection.receiver.fullName ?? "",
            ...(updatedConnection.receiver.profilePic !== null && updatedConnection.receiver.profilePic !== undefined ? { profilePic: updatedConnection.receiver.profilePic } : {}),
            ...(updatedConnection.receiver.jobTitle !== null && updatedConnection.receiver.jobTitle !== undefined ? { jobTitle: updatedConnection.receiver.jobTitle } : {}),
            ...(updatedConnection.receiver.department !== null && updatedConnection.receiver.department !== undefined ? { department: updatedConnection.receiver.department } : {})
        },
        createdAt: updatedConnection.createdAt,
        updatedAt: updatedConnection.updatedAt
    };
    
    // Invalidate caches
    await deleteMultipleCache([
        `user:pending-requests:${userId}`,
        `user:sent-requests:${connection.senderId}`,
        `connection:status:${connection.senderId}:${connection.receiverId}`,
        `connection:status:${connection.receiverId}:${connection.senderId}`
    ]);

    return response;
}


export const blockUser = async (senderId: number, receiverId: number): Promise<void> => {
    if (senderId === receiverId) {
        throw new Error('Cannot block yourself');
    }

    // Check for existing connection (including soft-deleted)
    const existingConnection = await prisma.connection.findFirst({
        where: {
            OR: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }
    });

    if (existingConnection) {
        // Update existing connection to BLOCKED
        await prisma.connection.update({
            where: { id: existingConnection.id },
            data: {
                isDeleted: false,
                deletedAt: null,
                status: ConnectionStatus.BLOCKED
            }
        });
    } else {
        // Create new block connection if none exists
        await prisma.connection.create({
            data: {
                senderId,
                receiverId,
                status: ConnectionStatus.BLOCKED
            }
        });
    }
    
    // Invalidate caches
    await deleteMultipleCache([
        `user:connections:${senderId}`,
        `user:connections:${receiverId}`,
        `user:blocked:${senderId}`,
        `user:pending-requests:${senderId}`,
        `user:pending-requests:${receiverId}`,
        `user:sent-requests:${senderId}`,
        `user:sent-requests:${receiverId}`,
        `user:stats:${senderId}`,
        `user:stats:${receiverId}`,
        `connection:status:${senderId}:${receiverId}`,
        `connection:status:${receiverId}:${senderId}`
    ]);
};

export const unblockUser = async (senderId: number, receiverId: number): Promise<void> => {
    if (senderId === receiverId) {
        throw new Error('Cannot unblock yourself');
    }

    const updatedConnection = await prisma.connection.updateMany({
        where: {
            OR: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ],
            status: ConnectionStatus.BLOCKED,
            isDeleted: false
        },
        data: {
            isDeleted: true,
            deletedAt: new Date()
        }
    });

    if (updatedConnection.count === 0) {
        throw new Error('No blocked connection found');
    }
    
    // Invalidate caches
    await deleteMultipleCache([
        `user:blocked:${senderId}`,
        `connection:status:${senderId}:${receiverId}`,
        `connection:status:${receiverId}:${senderId}`
    ]);
};

export const removeConnection = async (
    userId1: number, 
    userId2: number
): Promise<void> => {
    if (userId1 === userId2) {
        throw new Error('Cannot remove connection with yourself');
    }
    
    await prisma.connection.updateMany({
        where: {
            OR: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ],
            isDeleted: false
        },
        data: {
            isDeleted: true,
            deletedAt: new Date()
            // deletedBy field is not in the schema
        }
    });
    
    // Invalidate caches
    await deleteMultipleCache([
        `user:connections:${userId1}`,
        `user:connections:${userId2}`,
        `connection:status:${userId1}:${userId2}`,
        `connection:status:${userId2}:${userId1}`,
        `user:stats:${userId1}`,
        `user:stats:${userId2}`
    ]);
} 

export const getPendingRequests = async (userId: number): Promise<ConnectionResponse[]> => {
    try {
        const cacheKey = `user:pending-requests:${userId}`;
        
        // Try cache first
        const cached = await getCache<ConnectionResponse[]>(cacheKey);
        if (cached) {
            return cached;
        }
        
        // Optimized query with minimal includes
        const connections = await prisma.connection.findMany({
            where: {
                receiverId: userId,
                status: ConnectionStatus.PENDING,
                isDeleted: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePic: true,
                        jobTitle: true,
                        department: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const responses: ConnectionResponse[] = connections.map((connection: any) => ({
            id: connection.id,
            senderId: connection.senderId,
            receiverId: connection.receiverId,
            status: connection.status as ConnectionStatus,
            message: connection.message ?? "",
            sender: {
                id: connection.sender.id,
                fullName: connection.sender.fullName ?? "",
                ...(connection.sender.profilePic ? { profilePic: connection.sender.profilePic } : {}),
                ...(connection.sender.jobTitle ? { jobTitle: connection.sender.jobTitle } : {}),
                ...(connection.sender.department ? { department: connection.sender.department } : {})
            },
            receiver: {
                id: userId,
                fullName: ""
            },
            createdAt: connection.createdAt,
            updatedAt: connection.updatedAt
        }));
        
        // Store in cache
        await setCache(cacheKey, responses, 300); // 5 minutes
        
        return responses;
    } catch (error) {
        throw error;
    }
}
  
export const getSentRequests = async (userId: number): Promise<ConnectionResponse[]> => {
    try {
        const cacheKey = `user:sent-requests:${userId}`;
        
        // Try cache first
        const cached = await getCache<ConnectionResponse[]>(cacheKey);
        if (cached) {
            return cached;
        }
        
        // Optimized query with minimal includes
        const connections = await prisma.connection.findMany({
            where: {
                senderId: userId,
                status: ConnectionStatus.PENDING,
                isDeleted: false
            },
            include: {
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePic: true,
                        jobTitle: true,
                        department: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const responses: ConnectionResponse[] = connections.map((connection: any) => ({
            id: connection.id,
            senderId: connection.senderId,
            receiverId: connection.receiverId,
            status: connection.status as ConnectionStatus,
            message: connection.message ?? "",
            sender: {
                id: userId,
                fullName: ""
            },
            receiver: {
                id: connection.receiver.id,
                fullName: connection.receiver.fullName ?? "",
                ...(connection.receiver.profilePic ? { profilePic: connection.receiver.profilePic } : {}),
                ...(connection.receiver.jobTitle ? { jobTitle: connection.receiver.jobTitle } : {}),
                ...(connection.receiver.department ? { department: connection.receiver.department } : {})
            },
            createdAt: connection.createdAt,
            updatedAt: connection.updatedAt
        }));
        
        // Store in cache
        await setCache(cacheKey, responses, 300); // 5 minutes

        return responses;
    } catch (error) {
        throw error;
    }
}




export const getConnections = async (userId: number): Promise<ConnectionResponse[]> => {
    try {
        const cacheKey = `user:connections:${userId}`;
        
        // Try cache first
        const cached = await getCache<ConnectionResponse[]>(cacheKey);
        if (cached) {
            return cached;
        }
        
        // Optimized single query
        const connections = await prisma.connection.findMany({
            where: {
                status: ConnectionStatus.ACCEPTED,
                isDeleted: false,
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePic: true,
                        jobTitle: true,
                        department: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePic: true,
                        jobTitle: true,
                        department: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const results = connections.map((connection: any) => {
            const connectedUser = connection.senderId === userId ? connection.receiver : connection.sender;
            
            return {
                id: connection.id,
                senderId: connection.senderId,
                receiverId: connection.receiverId,
                status: connection.status as ConnectionStatus,
                message: connection.message ?? "",
                sender: {
                    id: connectedUser.id,
                    fullName: connectedUser.fullName ?? "",
                    profilePic: connectedUser.profilePic || undefined,
                    jobTitle: connectedUser.jobTitle || undefined,
                    department: connectedUser.department || undefined
                },
                receiver: {
                    id: userId,
                    fullName: ""
                },
                createdAt: connection.createdAt,
                updatedAt: connection.updatedAt
            };
        });
        
        // Store in cache
        await setCache(cacheKey, results, 600); // 10 minutes
        
        return results;
    } catch (error) {
        throw error;
    }
}

// New function to get simplified connected users list
export const getConnectedUsers = async (userId: number): Promise<ConnectedUser[]> => {
    try {
        const connections = await prisma.connection.findMany({
            where: {
                status: ConnectionStatus.ACCEPTED,
                isDeleted: false,
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePic: true,
                        jobTitle: true,
                        department: true,
                        isOnline: true,
                        lastSeen: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePic: true,
                        jobTitle: true,
                        department: true,
                        isOnline: true,
                        lastSeen: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const connectedUsers = connections.map((connection: any) => {
            const connectedUser = connection.senderId === userId ? connection.receiver : connection.sender;
            
            return {
                id: connectedUser.id,
                fullName: connectedUser.fullName ?? "",
                profilePic: connectedUser.profilePic || undefined,
                jobTitle: connectedUser.jobTitle || undefined,
                department: connectedUser.department || undefined,
                isOnline: connectedUser.isOnline ?? false,
                lastSeen: connectedUser.lastSeen || undefined,
                connectionId: connection.id,
                connectedAt: connection.updatedAt
            };
        });
        
        return await processProfileImages(connectedUsers);
    } catch (error) {
        throw error;
    }
}


// Get blocked users
export const getBlockedUsers = async (userId: number): Promise<ConnectionResponse[]> => {
    const cacheKey = `user:blocked:${userId}`;
    
    // Try cache first
    const cached = await getCache<ConnectionResponse[]>(cacheKey);
    if (cached) {
        return cached;
    }
    
    const connections = await prisma.connection.findMany({
        where: {
            senderId: userId,
            status: ConnectionStatus.BLOCKED,
            isDeleted: false
        },
        include: {
            sender: {
                select: {
                    id: true,
                    fullName: true,
                    profilePic: true,
                    jobTitle: true,
                    department: true
                }
            },
            receiver: {
                select: {
                    id: true,
                    fullName: true,
                    profilePic: true,
                    jobTitle: true,
                    department: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const results = connections.map((connection: any) => ({
        id: connection.id,
        senderId: connection.senderId,
        receiverId: connection.receiverId,
        status: connection.status as ConnectionStatus,
        message: connection.message ?? "",
        sender: {
            id: connection.sender.id,
            fullName: connection.sender.fullName ?? "",
            ...(connection.sender.profilePic !== null && connection.sender.profilePic !== undefined ? { profilePic: connection.sender.profilePic } : {}),
            ...(connection.sender.jobTitle !== null && connection.sender.jobTitle !== undefined ? { jobTitle: connection.sender.jobTitle } : {}),
            ...(connection.sender.department !== null && connection.sender.department !== undefined ? { department: connection.sender.department } : {})
        },
        receiver: {
            id: connection.receiver.id,
            fullName: connection.receiver.fullName ?? "",
            ...(connection.receiver.profilePic !== null && connection.receiver.profilePic !== undefined ? { profilePic: connection.receiver.profilePic } : {}),
            ...(connection.receiver.jobTitle !== null && connection.receiver.jobTitle !== undefined ? { jobTitle: connection.receiver.jobTitle } : {}),
            ...(connection.receiver.department !== null && connection.receiver.department !== undefined ? { department: connection.receiver.department } : {})
        },
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
    }));
    
    // Process profile images for receivers (blocked users)
    const processedReceivers = await processProfileImages(results.map(r => r.receiver));
    const finalResults = results.map((result, index) => ({
        ...result,
        receiver: processedReceivers[index]
    }));
    
    // Store in cache
    await setCache(cacheKey, finalResults, 900); // 15 minutes
    
    return finalResults;
};

// Check connection status between two users
export const getConnectionStatus = async (userId: number, targetUserId: number): Promise<string> => {
    try {
        const cacheKey = `connection:status:${userId}:${targetUserId}`;
        
        // Try cache first
        const cached = await getCache<string>(cacheKey);
        if (cached) {
            return cached;
        }
        
        const connection = await prisma.connection.findFirst({
            where: {
                isDeleted: false,
                OR: [
                    { senderId: userId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: userId }
                ]
            }
        });

        let status: string;
        if (!connection) status = 'NONE';
        else if (connection.status === ConnectionStatus.BLOCKED) status = 'BLOCKED';
        else if (connection.status === ConnectionStatus.ACCEPTED) status = 'CONNECTED';
        else if (connection.senderId === userId) status = 'SENT';
        else status = 'RECEIVED';
        
        // Store in cache
        await setCache(cacheKey, status, 300); // 5 minutes
        
        return status;
    } catch (error) {
        throw error;
    }
};

export const getConnectionStats = async (userId: number): Promise<ConnectionStats> => {
    try {
        const cacheKey = `user:stats:${userId}`;
        
        // Try cache first
        const cached = await getCache<ConnectionStats>(cacheKey);
        if (cached) {
            return cached;
        }
        
        // Total accepted connections (user is sender or receiver)
        const totalAccepted = await prisma.connection.count({
            where: {
                status: ConnectionStatus.ACCEPTED,
                isDeleted: false,
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            }
        });

        // Total pending connections (user is sender or receiver)
        const totalPending = await prisma.connection.count({
            where: {
                status: ConnectionStatus.PENDING,
                isDeleted: false,
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            }
        });

        const stats = {
            totalAcceptedConnections: totalAccepted,
            totalPendingConnections: totalPending
        };
        
        // Store in cache
        await setCache(cacheKey, stats, 600); // 10 minutes
        
        return stats;
    } catch (error) {
        throw error;
    }
};