import express from 'express';
import { createUserController,loginuserController,getUserProfileController,logoutUserController,forgotPasswordController,verifyOTPController,resetPasswordController } from '../controllers/auth.controller';
import { protectRoute } from '../middleware/middleware';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimiter';

const authRouter = express.Router();

// Route to create a new user
authRouter.post('/register', registerRateLimiter, createUserController);
authRouter.post('/login', loginRateLimiter, loginuserController);
authRouter.get('/get-profile',protectRoute,getUserProfileController);
authRouter.post('/logout',protectRoute,logoutUserController);
authRouter.post('/forgot-password', forgotPasswordController);
authRouter.post('/verify-otp', verifyOTPController);
authRouter.post('/reset-password', resetPasswordController);

export default authRouter;