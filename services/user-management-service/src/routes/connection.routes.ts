import { Router } from 'express';
import {
    sendConnectionRequestController,
    acceptConnectionRequestController,
    declineConnectionRequestController,
    blockUserController,
    unblockUserController,
    removeConnectionController,
    getPendingRequestsController,
    getSentRequestsController,
    getConnectionsController,
    getBlockedUsersController,
    getConnectionStatusController,
    getConnectionStatsController
} from '../controllers/connection.controller';
import {protectRoute} from '../middleware/middleware';

const connectionrouter = Router();

// Apply authentication middleware to all routes
connectionrouter.use(protectRoute);

// Connection request routes
connectionrouter.post('/request', sendConnectionRequestController);
connectionrouter.put('/request/:connectionId/accept', acceptConnectionRequestController);
connectionrouter.put('/request/:connectionId/decline', declineConnectionRequestController);

// Block/Unblock routes
connectionrouter.post('/block/:userId', blockUserController);
connectionrouter.delete('/block/:userId', unblockUserController);

// Connection management
connectionrouter.delete('/remove/:userId', removeConnectionController);

// Get routes
connectionrouter.get('/pending', getPendingRequestsController);
connectionrouter.get('/sent', getSentRequestsController);
connectionrouter.get('/list', getConnectionsController);
connectionrouter.get('/blocked', getBlockedUsersController);
connectionrouter.get('/status/:userId', getConnectionStatusController);
connectionrouter.get('/stats', getConnectionStatsController);

export default connectionrouter;