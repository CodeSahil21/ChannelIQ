import { Response, NextFunction } from 'express';
import jwt,{JwtPayload} from 'jsonwebtoken';
import prisma from '../db';
import { AuthenticatedRequest } from '../utils/types';
import { getAuthState } from '../redis';
import { CacheService, CacheKeys } from '../utils/cache';
import { config } from '../utils/config';
import { ApiError } from '../utils/apiError';

export const authenticateAndRequireChatUser = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.token;

        if (!token) {
            throw new ApiError(401, "Unauthorized - No token provided");
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload & { id?: number; jti?: string };

        if (!decoded || !decoded.id || !decoded.jti) {
            throw new ApiError(401, "Unauthorized - Invalid token");
        }

        const userCacheKey = CacheKeys.chatUser(decoded.id);
        
        const cachedUser = await CacheService.get<{ id: number; email: string; fullName: string; profileUrl: string | null }>(userCacheKey);
        
        if (cachedUser) {
            const { blacklisted, session } = await getAuthState<{ id: number }>(decoded.jti);

            if (blacklisted) {
                throw new ApiError(401, "Unauthorized - Token revoked");
            }
            if (!session || session.id !== decoded.id) {
                throw new ApiError(401, "Unauthorized - Session expired");
            }

            req.user = cachedUser;
            return next();
        }

        const [{ blacklisted, session }, chatUser] = await Promise.all([
            getAuthState<{ id: number }>(decoded.jti),
            prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, fullName: true, profileUrl: true }
            })
        ]);

        if (blacklisted) {
            throw new ApiError(401, "Unauthorized - Token revoked");
        }

        if (!session || session.id !== decoded.id) {
            throw new ApiError(401, "Unauthorized - Session expired");
        }

        if (!chatUser) {
            throw new ApiError(404, "User not found in chat service - Please sync your profile");
        }

        await CacheService.set(userCacheKey, chatUser, 1800);
        
        req.user = chatUser;
        next();
    } catch (error: any) {
        next(error);
    }
};


