import {
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    blockUser,
    unblockUser,
    getPendingRequests,
    getSentRequests,
    getConnections,
    getConnectionStatus,
    getBlockedUsers,
    getConnectionStats,
    removeConnection,
} from '../services/connection.service';
import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/types';
import {sendConnectionRequestSchema,connectionIdParamSchema,userIdParamSchema} from "../utils/schema"

// Send connection request
export const sendConnectionRequestController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const validationResult = sendConnectionRequestSchema.safeParse(req.body);

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
        }
        const { receiverId, message } = validationResult.data;
        const senderId = req.user?.id;

        if (!senderId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        if (!receiverId) {
          res.status(400).json({ error: 'Receiver ID is required' });
          return;
        }

        const connection = await sendConnectionRequest({
            senderId,
            receiverId,
            message: message ?? ""
        });

        res.status(201).json({
            success: true,
            message: 'Connection request sent successfully',
            data: connection
        });
    } catch (error: any) {
// Handle specific business logic errors
        if (error.message.includes('Cannot send connection request to yourself')) {
            res.status(400).json({
                success: false,
                message: error.message
            });
            return;
        }
        
        if (error.message.includes('already pending') || 
            error.message.includes('already connected') ||
            error.message.includes('blocked user')) {
            res.status(409).json({
                success: false,
                message: error.message
            });
            return;
        }

        // Handle database errors
        if (error.code?.startsWith('P')) {
            res.status(503).json({
                success: false,
                message: "Database service temporarily unavailable"
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Accept connection request
export const acceptConnectionRequestController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const validationResult = connectionIdParamSchema.safeParse(req.params);
        const userId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
        }

        if (!userId) {
           res.status(401).json({ error: 'Unauthorized' });
           return;
        }

        const { connectionId } = validationResult.data;

        const connection = await acceptConnectionRequest(connectionId, userId);

        res.status(200).json({
            success: true,
            message: 'Connection request accepted successfully',
            data: connection
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Decline connection request
export const declineConnectionRequestController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const validationResult = connectionIdParamSchema.safeParse(req.params);
        const userId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
        }

        if (!userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        const { connectionId } = validationResult.data;

        const connection = await declineConnectionRequest(connectionId, userId);

        res.status(200).json({
            success: true,
            message: 'Connection request declined successfully',
            data: connection
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Block user
export const blockUserController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const validationResult = userIdParamSchema.safeParse(req.params);
        const senderId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
        }

        if (!senderId) {
           res.status(401).json({ error: 'Unauthorized' });
           return;
        }

        const { userId } = validationResult.data;


        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        await blockUser(senderId, userId, userAgent, ipAddress as string);

        res.status(200).json({
            success: true,
            message: 'User blocked successfully'
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Unblock user
export const unblockUserController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const validationResult = userIdParamSchema.safeParse(req.params);
        const senderId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
        }

        if (!senderId) {
           res.status(401).json({ error: 'Unauthorized' });
           return;
        }

        const { userId } = validationResult.data;
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        await unblockUser(senderId, userId, userAgent, ipAddress as string);

        res.status(200).json({
            success: true,
            message: 'User unblocked successfully'
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Remove connection
export const removeConnectionController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const validationResult = userIdParamSchema.safeParse(req.params);
        const senderId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
        }

        if (!senderId) {
           res.status(401).json({ error: 'Unauthorized' });
           return;
        }

        const { userId:targetUserId } = validationResult.data;

        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        await removeConnection(senderId, targetUserId, userAgent, ipAddress as string);

        res.status(200).json({
            success: true,
            message: 'Connection removed successfully'
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get pending requests (received by user)
export const getPendingRequestsController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
         res.status(401).json({ error: 'Unauthorized' });
         return;
        }

        const pendingRequests = await getPendingRequests(userId);

        res.status(200).json({
            success: true,
            message: 'Pending requests retrieved successfully',
            data: pendingRequests
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get sent requests (sent by user)
export const getSentRequestsController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const sentRequests = await getSentRequests(userId);

        res.status(200).json({
            success: true,
            message: 'Sent requests retrieved successfully',
            data: sentRequests
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all connections
export const getConnectionsController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
         res.status(401).json({ error: 'Unauthorized' });
         return;
        }

        const connections = await getConnections(userId);

        res.status(200).json({
            success: true,
            message: 'Connections retrieved successfully',
            data: connections
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get blocked users
export const getBlockedUsersController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
         res.status(401).json({ error: 'Unauthorized' });
         return;
        }

        const blockedUsers = await getBlockedUsers(userId);

        res.status(200).json({
            success: true,
            message: 'Blocked users retrieved successfully',
            data: blockedUsers
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get connection status between two users
export const getConnectionStatusController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const validationResult = userIdParamSchema.safeParse(req.params);
        const senderId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: fieldErrors
            });
            return;
        }

        if (!senderId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        const {userId:targetUserId} = validationResult.data;
        const status = await getConnectionStatus(senderId, targetUserId);

        res.status(200).json({
            success: true,
            message: 'Connection status retrieved successfully',
            data: { status }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get connection statistics
export const getConnectionStatsController = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const stats = await getConnectionStats(userId);

        res.status(200).json({
            success: true,
            message: 'Connection statistics retrieved successfully',
            data: stats
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};