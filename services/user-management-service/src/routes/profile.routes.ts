import express from 'express';
import { 
    createProfileController, 
    getProfileController, 
    updateProfileController,
    fetchUserProfileController,
    deleteProfileController,
    restoreUserController
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
userManagementRouter.delete('/delete-profile', protectRoute, deleteProfileController);
userManagementRouter.post('/restore-user/:userId', protectRoute, restoreUserController);

// User preferences routes
userManagementRouter.get('/preferences', protectRoute, getUserPreferenceController);
userManagementRouter.put('/preferences', protectRoute, updateUserPreferenceController);

export default userManagementRouter;