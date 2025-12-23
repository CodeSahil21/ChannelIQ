import { Response, NextFunction } from 'express';
import jwt,{JwtPayload} from 'jsonwebtoken';
import prisma from '../db';
import { AuthenticatedRequest } from '../utils/types';
import { getAuthState, getCache, setCache } from '../redis';

// Combined middleware with SMART CACHING - eliminates most DB calls
export const authenticateAndRequireChatUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

        const userCacheKey = `chat_user:${decoded.id}`;
        
        // Try to get user from cache first
        const cachedUser = await getCache<{ id: number; email: string; fullName: string; profileUrl: string | null }>(userCacheKey);
        
        if (cachedUser) {
            // ✅ Cached-user path: auth checks in 1 Redis RTT
            const { blacklisted, session } = await getAuthState<{ id: number }>(decoded.jti);

            if (blacklisted) {
                res.status(401).json({ success: false, message: "Unauthorized - Token revoked" });
                return;
            }
            if (!session || session.id !== decoded.id) {
                res.status(401).json({ success: false, message: "Unauthorized - Session expired" });
                return;
            }

            req.user = cachedUser;
            return next();
        }

        // ✅ Miss path: run auth state + DB in parallel
        const [{ blacklisted, session }, chatUser] = await Promise.all([
            getAuthState<{ id: number }>(decoded.jti),
            prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, fullName: true, profileUrl: true }
            })
        ]);

        if (blacklisted) {
            res.status(401).json({ success: false, message: "Unauthorized - Token revoked" });
            return;
        }

        if (!session || session.id !== decoded.id) {
            res.status(401).json({ success: false, message: "Unauthorized - Session expired" });
            return;
        }

        if (!chatUser) {
            res.status(404).json({
                success: false,
                message: "User not found in chat service - Please sync your profile"
            });
            return;
        }

        // Cache user for future requests
        await setCache(userCacheKey, chatUser, 6000);
        
        req.user = chatUser;
        next();
    } catch (error: any) {
        console.error("Error in authenticateAndRequireChatUser middleware:", error);
        handleAuthError(error, res);
    }
};

// Helper function for consistent error handling
const handleAuthError = (error: any, res: Response): void => {
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
        return;
    }

    if (error.name === 'TokenExpiredError') {
        res.status(401).json({ success: false, message: "Unauthorized - Token expired" });
        return;
    }

    if (error.code?.startsWith('P')) {
        res.status(503).json({ success: false, message: "Service temporarily unavailable" });
        return;
    }

    res.status(500).json({ success: false, message: "Internal server error" });
};


