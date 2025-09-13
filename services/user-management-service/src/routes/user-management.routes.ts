import express from 'express';
import { 
    createProfileController, 
    getProfileController, 
    updateProfileController,
    fetchUserProfileController
} from '../controllers/profile.controller';
import { protectRoute } from '../middleware/middleware';

const userManagementRouter = express.Router();

// Route to create a new user profile
userManagementRouter.post('/create-profile', protectRoute, createProfileController);
userManagementRouter.put('/update-profile', protectRoute, updateProfileController);
userManagementRouter.get('/get-profile', protectRoute, getProfileController);   
userManagementRouter.get('/fetch-profile/:userId', protectRoute, fetchUserProfileController);


export default userManagementRouter;