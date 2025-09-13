import prisma from '../db/index'
import {
    ConnectionRequest,
    ConnectionResponse, 
    ConnectionStatus,
     ConnectionStats,
} from '../utils/types';



export const sendConnectionRequest = async (request: ConnectionRequest): Promise<ConnectionResponse> => {
    const { senderId, receiverId, message } = request;

    if (senderId === receiverId) {
        throw new Error("Cannot send connection request to yourself");
    }

    // ✅ ADD THIS - Check for existing connection
    const existingConnection = await prisma.connection.findFirst({
        where: {
            OR: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }
    });

    if (existingConnection) {
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


    // ...existing connection creation code...
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


export const blockUser = async (senderId: number, receiverId: number): Promise<void> => {
    if (senderId === receiverId) {
        throw new Error('Cannot block yourself');
    }

    // Remove any existing connection between the users
    await prisma.connection.deleteMany({
        where: {
            OR: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }
    });

    // Create a new block connection
    await prisma.connection.create({
        data: {
            senderId,
            receiverId,
            status: ConnectionStatus.BLOCKED
        }
    });
};


export const unblockUser = async (senderId: number, receiverId: number): Promise<void> => {
    if (senderId === receiverId) {
        throw new Error('Cannot unblock yourself');
    }
    try {
      await prisma.connection.deleteMany({
        where: {
          senderId,
          receiverId,
          status: ConnectionStatus.BLOCKED
        }
      });
    } catch (error) {
      throw error;
    }
}   

export const removeConnection = async (userId1: number, userId2: number): Promise<void> => {
    if (userId1 === userId2) {
        throw new Error('Cannot remove connection with yourself');
    }

    await prisma.connection.deleteMany({
        where: {
            OR: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ]
        }
    });
} 

export const getPendingRequests = async (userId: number): Promise<ConnectionResponse[]> => {
    try {
        const connections = await prisma.connection.findMany({
            where: {
                receiverId: userId,
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
            orderBy: { createdAt: 'desc' }
        });

        // Map connections to show the connected user (not the current user)
        return connections.map((connection: any) => {
            // Determine which user is the "other" user (the connected person)
            const connectedUser = connection.senderId === userId ? connection.receiver : connection.sender;
            
            return {
                id: connection.id,
                senderId: connection.senderId,
                receiverId: connection.receiverId,
                status: connection.status as ConnectionStatus,
                message: connection.message ?? "",
                // Put the connected user's info in sender field for consistency
                sender: {
                    id: connectedUser.id,
                    fullName: connectedUser.fullName ?? "",
                    ...(connectedUser.profilePic !== null && connectedUser.profilePic !== undefined ? { profilePic: connectedUser.profilePic } : {}),
                    ...(connectedUser.jobTitle !== null && connectedUser.jobTitle !== undefined ? { jobTitle: connectedUser.jobTitle } : {}),
                    ...(connectedUser.department !== null && connectedUser.department !== undefined ? { department: connectedUser.department } : {}),
                    ...(connectedUser.isOnline !== undefined ? { isOnline: connectedUser.isOnline } : {}),
                    ...(connectedUser.lastSeen !== undefined ? { lastSeen: connectedUser.lastSeen } : {})
                },
                receiver: {
                    id: userId,
                    fullName: "", // You can populate this if needed
                },
                createdAt: connection.createdAt,
                updatedAt: connection.updatedAt
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
            status: ConnectionStatus.BLOCKED
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