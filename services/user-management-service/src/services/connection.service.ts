import prisma from '../db/index';
import {
    ConnectionRequest,
    ConnectionResponse, 
    ConnectionStatus,
    ConnectionStats,
    ConnectedUser,
    ActivityType
} from '../utils/types';
import { logUserActivity } from './activity.service';



export const sendConnectionRequest = async (request: ConnectionRequest): Promise<ConnectionResponse> => {
    const { senderId, receiverId, message } = request;

    if (senderId === receiverId) {
        throw new Error("Cannot send connection request to yourself");
    }

    // Check if both users exist
    const [senderExists, receiverExists] = await Promise.all([
        prisma.user.findUnique({
            where: { id: senderId, isDeleted: false },
            select: { id: true }
        }),
        prisma.user.findUnique({
            where: { id: receiverId, isDeleted: false },
            select: { id: true }
        })
    ]);

    if (!senderExists || !receiverExists) {
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
        // If connection exists but is soft-deleted, reactivate it
        if (existingConnection.isDeleted) {
            const reactivatedConnection = await prisma.connection.update({
                where: { id: existingConnection.id },
                data: {
                    isDeleted: false,
                    deletedAt: null,
                    status: ConnectionStatus.PENDING,
                    message: message ?? null,
                    senderId,
                    receiverId
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
    // Find the connection
    const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
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

    if (!connection) {
        throw new Error("Connection request not found");
    }

    if (connection.receiverId !== userId) {
        throw new Error("You are not authorized to accept this connection request");
    }

    if (connection.status !== ConnectionStatus.PENDING) {
        throw new Error("Connection request is not pending");
    }

    // Update the connection status to ACCEPTED
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

    return response;
}


export const declineConnectionRequest = async (connectionId: number, userId: number): Promise<ConnectionResponse> => {
    // Find the connection
    const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
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

    if (!connection) {
        throw new Error("Connection request not found");
    }

    if (connection.receiverId !== userId) {
        throw new Error("You are not authorized to accept this connection request");
    }

    if (connection.status !== ConnectionStatus.PENDING) {
        throw new Error("Connection request is not pending");
    }

    // Update the connection status to ACCEPTED
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

    return response;
}


export const blockUser = async (senderId: number, receiverId: number, userAgent?: string, ipAddress?: string): Promise<void> => {
    if (senderId === receiverId) {
        throw new Error('Cannot block yourself');
    }

    // Check if user exists before blocking
    const userExists = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true }
    });

    if (!userExists) {
        throw new Error('User not found');
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
                status: ConnectionStatus.BLOCKED,
                senderId,
                receiverId
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
    
    // Log the activity
    await logUserActivity(
        senderId,
        ActivityType.USER_BLOCKED,
        'User blocked',
        { blockedUserId: receiverId },
        ipAddress,
        userAgent
    );
};

export const unblockUser = async (senderId: number, receiverId: number, userAgent?: string, ipAddress?: string): Promise<void> => {
    if (senderId === receiverId) {
        throw new Error('Cannot unblock yourself');
    }

    const updatedConnection = await prisma.connection.updateMany({
        where: {
            senderId,
            receiverId,
            status: ConnectionStatus.BLOCKED,
            isDeleted: false
        },
        data: {
            isDeleted: true,
            deletedAt: new Date()
            // deletedBy field is not in the schema
        }
    });

    if (updatedConnection.count === 0) {
        throw new Error('No blocked connection found');
    }
    
    // Log the activity
    await logUserActivity(
        senderId,
        ActivityType.USER_UNBLOCKED,
        'User unblocked',
        { unblockedUserId: receiverId },
        ipAddress,
        userAgent
    );
};

export const removeConnection = async (
    userId1: number, 
    userId2: number, 
    userAgent?: string, 
    ipAddress?: string
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
    
    // Log the activity
    await logUserActivity(
        userId1,
        ActivityType.CONNECTION_REMOVED,
        'Connection removed',
        { otherUserId: userId2 },
        ipAddress,
        userAgent
    );
} 

export const getPendingRequests = async (userId: number): Promise<ConnectionResponse[]> => {
    try {
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

        const responses: ConnectionResponse[] = connections.map(connection => ({
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
        return responses;
    } catch (error) {
        throw error;
    }
}
  
export const getSentRequests = async (userId: number): Promise<ConnectionResponse[]> => {
    try {
        const connections = await prisma.connection.findMany({
            where: {
                senderId: userId,
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

        const responses: ConnectionResponse[] = connections.map(connection => ({
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

        return responses;
    } catch (error) {
        throw error;
    }
}




export const getConnections = async (userId: number): Promise<ConnectionResponse[]> => {
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

        return connections.map((connection: any) => {
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

        return connections.map((connection: any) => {
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
    } catch (error) {
        throw error;
    }
}


// Get blocked users
export const getBlockedUsers = async (userId: number): Promise<ConnectionResponse[]> => {
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

    return connections.map(connection => ({
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
};

// Check connection status between two users
export const getConnectionStatus = async (userId: number, targetUserId: number): Promise<string> => {
    try {
        const connection = await prisma.connection.findFirst({
            where: {
                isDeleted: false,
                OR: [
                    { senderId: userId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: userId }
                ]
            }
        });

        if (!connection) return 'NONE';
        if (connection.status === ConnectionStatus.BLOCKED) return 'BLOCKED';
        if (connection.status === ConnectionStatus.ACCEPTED) return 'CONNECTED';
        if (connection.senderId === userId) return 'SENT';
        return 'RECEIVED';
    } catch (error) {
        throw error;
    }
};

export const getConnectionStats = async (userId: number): Promise<ConnectionStats> => {
    try {
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

        return {
            totalAcceptedConnections: totalAccepted,
            totalPendingConnections: totalPending
        };
    } catch (error) {
        throw error;
    }
};