import {
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    blockUser,
    unblockUser,
    getPendingRequests,
    getSentRequests,
    getConnections,
    getConnectedUsers,
    getConnectionStatus,
    getBlockedUsers,
    getConnectionStats,
    removeConnection,
} from '../services/connection.service';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../utils/types';
import {sendConnectionRequestSchema,connectionIdParamSchema,userIdParamSchema} from "../utils/schema"
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { connectionsTotal } from '../utils/metrics';
import logger from '../utils/logger';

// Send connection request
export const sendConnectionRequestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const validationResult = sendConnectionRequestSchema.safeParse(req.body);

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }
        
        const { receiverId, message } = validationResult.data;
        const senderId = req.user?.id;

        if (!senderId) {
            throw new ApiError(401, 'Unauthorized');
        }

        if (!receiverId) {
            throw new ApiError(400, 'Receiver ID is required');
        }

        const connection = await sendConnectionRequest({
            senderId,
            receiverId,
            message: message ?? ""
        });

        const response = new ApiResponse(201, connection, 'Connection request sent successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        const err = error as { message?: string; code?: string };

        if (err.message?.includes('Cannot send connection request to yourself')) {
            return next(new ApiError(400, err.message));
        }
        
        if (err.message?.includes('already pending') || 
            err.message?.includes('already connected') ||
            err.message?.includes('blocked user')) {
            return next(new ApiError(409, err.message));
        }
        
        if (err.message === "One or both users not found") {
            return next(new ApiError(404, err.message));
        }

        next(error);
    }
};

// Accept connection request
export const acceptConnectionRequestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const validationResult = connectionIdParamSchema.safeParse(req.params);
        const userId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        if (!userId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const { connectionId } = validationResult.data;
        const connection = await acceptConnectionRequest(connectionId, userId);
        
        // Increment connections metric when connection is accepted
        connectionsTotal.inc();
        logger.info('Connection request accepted', { connectionId, userId });

        const response = new ApiResponse(200, connection, 'Connection request accepted successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        const err = error as { message?: string };
        
        if (err.message === "Connection request not found") {
            return next(new ApiError(404, err.message));
        }
        
        if (err.message?.includes('not authorized') || err.message?.includes('not pending')) {
            return next(new ApiError(403, err.message));
        }
        
        next(error);
    }
};

// Decline connection request
export const declineConnectionRequestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const validationResult = connectionIdParamSchema.safeParse(req.params);
        const userId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        if (!userId) {
            throw new ApiError(401, 'Unauthorized');
        }
        
        const { connectionId } = validationResult.data;
        const connection = await declineConnectionRequest(connectionId, userId);

        const response = new ApiResponse(200, connection, 'Connection request declined successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        const err = error as { message?: string };
        
        if (err.message === "Connection request not found") {
            return next(new ApiError(404, err.message));
        }
        
        if (err.message?.includes('not authorized') || err.message?.includes('not pending')) {
            return next(new ApiError(403, err.message));
        }
        
        next(error);
    }
};

// Block user
export const blockUserController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const validationResult = userIdParamSchema.safeParse(req.params);
        const senderId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        if (!senderId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const { userId } = validationResult.data;
        await blockUser(senderId, userId);

        const response = new ApiResponse(200, null, 'User blocked successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        const err = error as { message?: string };
        
        if (err.message === 'User not found') {
            return next(new ApiError(404, err.message));
        }
        
        if (err.message?.includes('Cannot block yourself')) {
            return next(new ApiError(400, err.message));
        }
        
        next(error);
    }
};

// Unblock user
export const unblockUserController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const validationResult = userIdParamSchema.safeParse(req.params);
        const senderId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        if (!senderId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const { userId } = validationResult.data;
        await unblockUser(senderId, userId);

        const response = new ApiResponse(200, null, 'User unblocked successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        const err = error as { message?: string };
        
        if (err.message === 'No blocked connection found') {
            return next(new ApiError(404, err.message));
        }
        
        if (err.message?.includes('Cannot unblock yourself')) {
            return next(new ApiError(400, err.message));
        }
        
        next(error);
    }
};

// Remove connection
export const removeConnectionController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const validationResult = userIdParamSchema.safeParse(req.params);
        const senderId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        if (!senderId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const { userId:targetUserId } = validationResult.data;
        await removeConnection(senderId, targetUserId);

        const response = new ApiResponse(200, null, 'Connection removed successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        const err = error as { message?: string };
        
        if (err.message?.includes('Cannot remove connection with yourself')) {
            return next(new ApiError(400, err.message));
        }
        
        next(error);
    }
};

// Get pending requests (received by user)
export const getPendingRequestsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const pendingRequests = await getPendingRequests(userId);

        const response = new ApiResponse(200, pendingRequests, 'Pending requests retrieved successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};

// Get sent requests (sent by user)
export const getSentRequestsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const sentRequests = await getSentRequests(userId);

        const response = new ApiResponse(200, sentRequests, 'Sent requests retrieved successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};

// Get all connections
export const getConnectionsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const connections = await getConnections(userId);

        const response = new ApiResponse(200, connections, 'Connections retrieved successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};

// Get blocked users
export const getBlockedUsersController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const blockedUsers = await getBlockedUsers(userId);

        const response = new ApiResponse(200, blockedUsers, 'Blocked users retrieved successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};

// Get connection status between two users
export const getConnectionStatusController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const validationResult = userIdParamSchema.safeParse(req.params);
        const senderId = req.user?.id;

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        if (!senderId) {
            throw new ApiError(401, 'Unauthorized');
        }
        
        const {userId:targetUserId} = validationResult.data;
        const status = await getConnectionStatus(senderId, targetUserId);

        const response = new ApiResponse(200, { status }, 'Connection status retrieved successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};

// Get connection statistics
export const getConnectionStatsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const stats = await getConnectionStats(userId);

        const response = new ApiResponse(200, stats, 'Connection statistics retrieved successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};

// Get connected users (simplified list)
export const getConnectedUsersController = async (req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, 'Unauthorized');
        }

        const connectedUsers = await getConnectedUsers(userId);

        const response = new ApiResponse(200, connectedUsers, 'Connected users retrieved successfully');
        res.status(response.statusCode).json(response);
    } catch (error: unknown) {
        next(error);
    }
};