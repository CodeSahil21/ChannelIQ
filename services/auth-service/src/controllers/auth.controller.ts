import { Request, Response, NextFunction } from 'express';
import { CreateUserSchema, LoginUserSchema,ForgotPasswordSchema,VerifyOTPSchema,ResetPasswordSchema } from '../utils/schema';
import { generateToken, comparePassword,isOTPExpired,generateOTP,getOTPExpirationTime,hashPassword } from '../utils/auth';
import { CreateUserService,sendOTPEmail } from '../services/auth.service';
import { AuthenticatedRequest } from '../utils/types';
import prisma from '../db/db';
import { eventPublisher } from '../kafka/publisher';
import { setSession, delSession, blacklist } from '../redis';
import { decodeJwtUnsafe } from '../utils/auth';
import { getCache, setCache, deleteCache, incrementCache } from '../utils/cache';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

export const createUserController = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = CreateUserSchema.safeParse(req.body);

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        const { email, password } = validationResult.data;
        
        const user = await CreateUserService({ 
            email: email.toLowerCase().trim(), 
            password
        });

        const token = generateToken(user.id);
        const { exp, jti } = decodeJwtUnsafe(token);
        const ttl = exp ? exp - Math.floor(Date.now() / 1000) : 7 * 24 * 60 * 60;
        await setSession(jti!, { id: user.id, email: user.email }, ttl);

        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/"
        });

        const response = new ApiResponse(201, { user }, "User created successfully");
        res.status(response.statusCode).json(response);

    } catch (error: any) {
        if (error.message === "User already exists with this email") {
            return next(new ApiError(409, "Email already registered"));
        }
        next(error);
    }
}

export const loginuserController = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = LoginUserSchema.safeParse(req.body);

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        const { email, password } = validationResult.data;
        const sanitizedEmail = email.toLowerCase().trim();

        const failedKey = `auth:failed:${sanitizedEmail}`;
        const failedAttempts = await getCache<number>(failedKey) || 0;

        if (failedAttempts >= 5) {
            throw new ApiError(429, "Too many failed attempts. Please try again after 15 minutes");
        }

        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
            select: {
                id: true,
                email: true,
                password: true,
            }
        });

        if (!user) {
            await comparePassword(password, "$2a$12$dummyhashtopreventtimingattacks.dummy.hash");
            throw new ApiError(401, "Invalid credentials");
        }

        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            await incrementCache(failedKey, 900);
            throw new ApiError(401, "Invalid credentials");
        }

        await deleteCache(failedKey);

        const token = generateToken(user.id);
        const { exp, jti } = decodeJwtUnsafe(token);
        const ttl = exp ? exp - Math.floor(Date.now() / 1000) : 7 * 24 * 60 * 60;
        await setSession(jti!, { id: user.id, email: user.email }, ttl);
       
        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/"
        });
        
        try {
            await eventPublisher.publishUserLoggedIn({
                userId: user.id,
                email:user.email
            });
        } catch (eventError) {
            console.error('❌ Failed to publish login event:', eventError);
        }

        const { password: _, ...userWithoutPassword } = user;

        const response = new ApiResponse(200, { user: userWithoutPassword }, "Login successful");
        res.status(response.statusCode).json(response);

    } catch (error: any) {
        next(error);
    }
}

export const getUserProfileController = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user;
        
        if (!user) {
            throw new ApiError(401, "Unauthorized - User not found");
        }

        const response = new ApiResponse(200, { user }, "Profile retrieved successfully");
        res.status(response.statusCode).json(response);

    } catch (error: any) {
        next(error);
    }
}

export const logoutUserController = async(_req:AuthenticatedRequest,res:Response, next: NextFunction):Promise<void> =>{
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/"
        });

        const jti: string | undefined = _req.sessionJti;
        if (jti) {
            await delSession(jti);
            await blacklist(jti, 60 * 5);
        }

        try {
            if (_req.user) {
            await eventPublisher.publishUserLoggedOut({
                userId: _req.user.id,
                email: _req.user.email
            });
            }
        } catch (eventError) {
            console.error('❌ Failed to publish logout event:', eventError);
        }

        const response = new ApiResponse(200, null, "Logged out successfully");
        res.status(response.statusCode).json(response);

    } catch (error: any) {
        next(error);
    }
}

export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = ForgotPasswordSchema.safeParse(req.body);

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        const { email } = validationResult.data;
        const sanitizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
            select: { id: true, email: true }
        });

        if (!user) {
            const response = new ApiResponse(200, null, "If an account with this email exists, you will receive an OTP");
            res.status(response.statusCode).json(response);
            return;
        }

        const otp = generateOTP();
        const otpExpiresAt = getOTPExpirationTime();

        const otpKey = `auth:otp:${sanitizedEmail}`;
        await setCache(otpKey, { otp, expiresAt: otpExpiresAt.toISOString() }, 600);

        await sendOTPEmail(user.email, otp);

        const response = new ApiResponse(200, null, "OTP sent to your email address");
        res.status(response.statusCode).json(response);

    } catch (error: any) {
        if (error.code === 'EAUTH' || error.code === 'ECONNECTION') {
            return next(new ApiError(503, "Email service temporarily unavailable"));
        }
        next(error);
    }
};

export const verifyOTPController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = VerifyOTPSchema.safeParse(req.body);

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        const { email, otp } = validationResult.data;
        const sanitizedEmail = email.toLowerCase().trim();

        const otpKey = `auth:otp:${sanitizedEmail}`;
        const cachedOTP = await getCache<{ otp: string; expiresAt: string }>(otpKey);

        if (!cachedOTP) {
            throw new ApiError(400, "Invalid or expired OTP");
        }

        if (isOTPExpired(new Date(cachedOTP.expiresAt))) {
            await deleteCache(otpKey);
            throw new ApiError(400, "OTP has expired");
        }

        if (cachedOTP.otp !== otp) {
            throw new ApiError(400, "Invalid OTP");
        }

        const response = new ApiResponse(200, null, "OTP verified successfully");
        res.status(response.statusCode).json(response);

    } catch (error: any) {
        next(error);
    }
};

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = ResetPasswordSchema.safeParse(req.body);

        if (!validationResult.success) {
            const fieldErrors = validationResult.error.issues.map(error => ({
                field: error.path.join('.'),
                message: error.message
            }));
            throw new ApiError(400, "Validation failed", fieldErrors);
        }

        const { email, otp, newPassword } = validationResult.data;
        const sanitizedEmail = email.toLowerCase().trim();

        const otpKey = `auth:otp:${sanitizedEmail}`;
        const cachedOTP = await getCache<{ otp: string; expiresAt: string }>(otpKey);

        if (!cachedOTP) {
            throw new ApiError(400, "Invalid or expired OTP");
        }

        if (isOTPExpired(new Date(cachedOTP.expiresAt))) {
            await deleteCache(otpKey);
            throw new ApiError(400, "OTP has expired");
        }

        if (cachedOTP.otp !== otp) {
            throw new ApiError(400, "Invalid OTP");
        }

        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
            select: { id: true }
        });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        await deleteCache(otpKey);

        const response = new ApiResponse(200, null, "Password reset successfully");
        res.status(response.statusCode).json(response);

    } catch (error: any) {
        next(error);
    }
};