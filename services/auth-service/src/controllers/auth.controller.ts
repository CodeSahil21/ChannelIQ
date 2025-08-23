import { Request, Response } from 'express';
import { CreateUserSchema, LoginUserSchema,ForgotPasswordSchema,VerifyOTPSchema,ResetPasswordSchema } from '../utils/schema';
import { generateToken, comparePassword,isOTPExpired,generateOTP,getOTPExpirationTime,hashPassword } from '../utils/auth';
import { CreateUserService,sendOTPEmail } from '../services/auth.service';
import { AuthenticatedRequest } from '../utils/types';
import prisma from '../db/db';

export const createUserController = async(req: Request, res: Response): Promise<void> => {
    try {
        // Validate the request body
        const validationResult = CreateUserSchema.safeParse(req.body);

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

        // Extract and sanitize validated data
        const { email, password, fullName } = validationResult.data;
        
        // Call the service to create user
        const user = await CreateUserService({ 
            email: email.toLowerCase().trim(), 
            password, 
            fullName: fullName.trim() 
        });

        // Generate a token for the user
        const token = generateToken(user.id);

        // Set the token as a secure cookie
        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                user
            }
        });

    } catch (error: any) {
        console.error("Error in createUserController:", error);

        // Handle specific business logic errors
        if (error.message === "User already exists with this email") {
            res.status(409).json({ 
                success: false,
                message: "Email already registered"
            });
            return;
        }

        // Handle Prisma database constraint errors
        if (error.code === 'P2002') {
            res.status(409).json({ 
                success: false,
                message: "Email already registered"
            });
            return;
        }

        // Handle validation errors from service
        if (error.name === 'ValidationError') {
            res.status(400).json({ 
                success: false,
                message: "Invalid input data"
            });
            return;
        }

        // Handle JWT token generation errors
        if (error.name === 'JsonWebTokenError') {
            res.status(500).json({ 
                success: false,
                message: "Service temporarily unavailable"
            });
            return;
        }

        // Handle database connection errors
        if (error.code?.startsWith('P')) {
            res.status(503).json({
                success: false,
                message: "Service temporarily unavailable"
            });
            return;
        }

        // Generic server error (don't expose internal details)
        res.status(500).json({ 
            success: false,
            message: "Internal server error"
        });
    }
}

export const loginuserController = async(req: Request, res: Response): Promise<void> => {
    try {
        // Validate the request body
        const validationResult = LoginUserSchema.safeParse(req.body);

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

        const { email, password } = validationResult.data;

        // Sanitize email input
        const sanitizedEmail = email.toLowerCase().trim();

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
            select: {
                id: true,
                email: true,
                password: true,
                fullName: true,
                profilePic:true
            }
        });

        // Security: Always compare password even if user doesn't exist
        // This prevents timing attacks
        if (!user) {
            await comparePassword(password, "$2a$12$dummyhashtopreventtimingattacks.dummy.hash");
            res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
            return;
        }

        // Compare password
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
            return;
        }

        // Generate token
        const token = generateToken(user.id);

        // Set secure cookie
        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: userWithoutPassword
            }
        });

    } catch (error: any) {
        console.error("Error in loginuserController:", error);

        // Handle Prisma database errors
        if (error.code?.startsWith('P')) {
            res.status(503).json({
                success: false,
                message: "Service temporarily unavailable"
            });
            return;
        }

        // Handle JWT token generation errors
        if (error.name === 'JsonWebTokenError') {
            res.status(500).json({
                success: false,
                message: "Service temporarily unavailable"
            });
            return;
        }

        // Handle bcrypt errors
        if (error.name === 'Error' && error.message.includes('bcrypt')) {
            res.status(500).json({
                success: false,
                message: "Service temporarily unavailable"
            });
            return;
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}



export const getUserProfileController = async(req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // The user is already attached by the protectRoute middleware
        const user = req.user;
        
        if (!user) {
            res.status(401).json({ 
                success: false,
                message: "Unauthorized - User not found" 
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            data: {
                user
            }
        });

    } catch (error: any) {
        console.error("Error in getUserProfileController:", error);

        // Handle Prisma database errors
        if (error.code?.startsWith('P')) {
            res.status(503).json({
                success: false,
                message: "Service temporarily unavailable"
            });
            return;
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const logoutUserController = async(_req:AuthenticatedRequest,res:Response):Promise<void> =>{
    try {
        // Clear the authentication cookie
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error: any) {
        console.error("Error in logoutController:", error);

        // Generic server error
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}


export const forgotPasswordController = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        const validationResult = ForgotPasswordSchema.safeParse(req.body);

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

        const { email } = validationResult.data;
        const sanitizedEmail = email.toLowerCase().trim();

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
            select: { id: true, email: true }
        });

        // Security: Don't reveal if email exists or not
        if (!user) {
            res.status(200).json({
                success: true,
                message: "If an account with this email exists, you will receive an OTP"
            });
            return;
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiresAt = getOTPExpirationTime();

        // Save OTP to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otp,
                otpExpiresAt
            }
        });

        // Send OTP email
        await sendOTPEmail(user.email, otp);

        res.status(200).json({
            success: true,
            message: "OTP sent to your email address"
        });

    } catch (error: any) {
        console.error("Error in forgotPasswordController:", error);

        // Handle email service errors
        if (error.code === 'EAUTH' || error.code === 'ECONNECTION') {
            res.status(503).json({
                success: false,
                message: "Email service temporarily unavailable"
            });
            return;
        }

        // Handle Prisma database errors
        if (error.code?.startsWith('P')) {
            res.status(503).json({
                success: false,
                message: "Service temporarily unavailable"
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const verifyOTPController = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        const validationResult = VerifyOTPSchema.safeParse(req.body);

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

        const { email, otp } = validationResult.data;
        const sanitizedEmail = email.toLowerCase().trim();

        // Find user with OTP
        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
            select: {
                id: true,
                email: true,
                otp: true,
                otpExpiresAt: true
            }
        });

        if (!user || !user.otp || !user.otpExpiresAt) {
            res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
            return;
        }

        // Check if OTP is expired
        if (isOTPExpired(user.otpExpiresAt)) {
            // Clear expired OTP
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    otp: null,
                    otpExpiresAt: null
                }
            });

            res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
            return;
        }

        // Verify OTP
        if (user.otp !== otp) {
            res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });

    } catch (error: any) {
        console.error("Error in verifyOTPController:", error);

        if (error.code?.startsWith('P')) {
            res.status(503).json({
                success: false,
                message: "Service temporarily unavailable"
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const resetPasswordController = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        const validationResult = ResetPasswordSchema.safeParse(req.body);

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

        const { email, otp, newPassword } = validationResult.data;
        const sanitizedEmail = email.toLowerCase().trim();

        // Find user with OTP
        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
            select: {
                id: true,
                email: true,
                otp: true,
                otpExpiresAt: true
            }
        });

        if (!user || !user.otp || !user.otpExpiresAt) {
            res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
            return;
        }

        // Check if OTP is expired
        if (isOTPExpired(user.otpExpiresAt)) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    otp: null,
                    otpExpiresAt: null
                }
            });

            res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
            return;
        }

        // Verify OTP
        if (user.otp !== otp) {
            res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
            return;
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password and clear OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpiresAt: null
            }
        });

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error: any) {
        console.error("Error in resetPasswordController:", error);

        if (error.code?.startsWith('P')) {
            res.status(503).json({
                success: false,
                message: "Service temporarily unavailable"
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};