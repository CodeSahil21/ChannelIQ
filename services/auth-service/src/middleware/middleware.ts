import {  Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../utils/types';
import { getSession, isBlacklisted } from '../redis';
import type { JwtPayload } from 'jsonwebtoken';

export const protectRoute = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get token from cookies (matching your auth controller cookie name)
        const token = req.cookies.token;

        if (!token) {
            res.status(401).json({ 
                success: false,
                message: "Unauthorized - No token provided" 
            });
            return;
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { id?: number; jti?: string };
        if (!decoded || !decoded.id || !decoded.jti) {
            res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
            return;
        }

        //  Blacklist check
        const blacklisted = await isBlacklisted(decoded.jti);
        if (blacklisted) {
            res.status(401).json({ success: false, message: "Unauthorized - Token revoked" });
            return;
        }

        //  Session presence check
        const session = await getSession<{ id: number; email?: string }>(decoded.jti);
        if (!session || session.id !== decoded.id) {
            res.status(401).json({ success: false, message: "Unauthorized - Session expired" });
            return;
        }
         req.user = { id: session.id, email: session.email || '' };
        req.sessionJti = decoded.jti;
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

        // Generic server error
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
};

