import {  Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../utils/types';
import { getSession, isBlacklisted } from '../redis';
import type { JwtPayload } from 'jsonwebtoken';
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

        const blacklisted = await isBlacklisted(decoded.jti);
        if (blacklisted) {
            throw new ApiError(401, "Unauthorized - Token revoked");
        }

        const session = await getSession<{ id: number; email?: string }>(decoded.jti);
        if (!session || session.id !== decoded.id) {
            throw new ApiError(401, "Unauthorized - Session expired");
        }
        
        req.user = { id: session.id, email: session.email || '' };
        req.sessionJti = decoded.jti;
        next();
    } catch (error: any) {
        next(error);
    }
};

