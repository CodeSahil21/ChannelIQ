import { Response, NextFunction } from 'express';
import jwt,{JwtPayload} from 'jsonwebtoken';
import prisma from '../db';
import { AuthenticatedRequest } from '../utils/types';
import { getSession, isBlacklisted } from '../redis';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

export const protectRoute = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.token;

        if (!token) {
            throw new ApiError(401, "Unauthorized - No token provided");
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { id?: number; jti?: string };

        if (!decoded || !decoded.id || !decoded.jti) {
            throw new ApiError(401, "Unauthorized - Invalid token");
        }

        // Check blacklist
        const blacklisted = await isBlacklisted(decoded.jti);
        if (blacklisted) {
            throw new ApiError(401, "Unauthorized - Token revoked");
        }

        // Check session presence in Redis
        const session = await getSession<{ id: number; email?: string }>(decoded.jti);
        if (!session || session.id !== decoded.id) {
            throw new ApiError(401, "Unauthorized - Session expired");
        }

        req.user = { id: session.id, email: session.email || '' };
        next();
    } catch (error: any) {
        next(error);
    }
};

export const requireProfileCreated = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user?.id) {
            throw new ApiError(401, "Unauthorized - User not found");
        }

        // Fetch profile details from the database
        const profile = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!profile || !profile.profileCreated) {
            throw new ApiError(403, "Profile not created. Please complete your profile to continue.");
        }

        // Attach profile details to request object if needed
        req.user = profile;
        next();
    } catch (error) {
        next(error);
    }
};
