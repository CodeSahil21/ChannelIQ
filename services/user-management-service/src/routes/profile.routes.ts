import express from 'express';
import { 
    createProfileController, 
    getProfileController, 
    updateProfileController,
    fetchUserProfileController,
    searchUsersController
} from '../controllers/profile.controller';
import {
    getUserPreferenceController,
    updateUserPreferenceController
} from '../controllers/preference.controller';
import { protectRoute } from '../middleware/middleware';

const userManagementRouter = express.Router();

// Route to create a new user profile
userManagementRouter.post('/create-profile', protectRoute, createProfileController);
userManagementRouter.put('/update-profile', protectRoute, updateProfileController);
userManagementRouter.get('/get-profile', protectRoute, getProfileController);   
userManagementRouter.get('/fetch-profile/:userId', protectRoute, fetchUserProfileController);

// User preferences routes
userManagementRouter.get('/preferences', protectRoute, getUserPreferenceController);
userManagementRouter.put('/preferences', protectRoute, updateUserPreferenceController);

// User search route
userManagementRouter.get('/search', protectRoute, searchUsersController);

export default userManagementRouter;