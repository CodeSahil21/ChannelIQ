import { Response, NextFunction } from 'express';
import jwt,{JwtPayload} from 'jsonwebtoken';
import prisma from '../db';
import { AuthenticatedRequest } from '../utils/types';
import { getSession, isBlacklisted } from '../redis';

export const protectRoute = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.token;

        if (!token) {
            res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { id?: number; jti?: string };

        if (!decoded || !decoded.id || !decoded.jti) {
            res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
            return;
        }

        // Check blacklist
        const blacklisted = await isBlacklisted(decoded.jti);
        if (blacklisted) {
            res.status(401).json({ success: false, message: "Unauthorized - Token revoked" });
            return;
        }

        // Check session presence in Redis
        const session = await getSession<{ id: number; email?: string }>(decoded.jti);
        if (!session || session.id !== decoded.id) {
            res.status(401).json({ success: false, message: "Unauthorized - Session expired" });
            return;
        }

        
        req.user = { id: session.id, email: session.email || '' };

        next();
    } catch (error: any) {
        console.error("Error in protectRoute middleware:", error);

        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ 
                success: false,
                message: "Unauthorized - Invalid token" 
            });
            return;
        }

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({ 
                success: false,
                message: "Unauthorized - Token expired" 
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

        // Generic server error
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
};

// Middleware to check if user has a profile and fetch profile details
export const requireProfileCreated = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user?.id) {
            res.status(401).json({
                success: false,
                message: "Unauthorized - User not found"
            });
            return;
        }

        // Fetch profile details from the database
        const profile = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!profile || !profile.profileCreated) {
            res.status(403).json({
            success: false,
            message: "Profile not created. Please complete your profile to continue."
            });
            return;
        }

        // Attach profile details to request object if needed
        req.user = profile;

        next();
    } catch (error) {
        console.error("Error in requireProfileCreated middleware:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
