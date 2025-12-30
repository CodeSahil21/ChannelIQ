import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getAuthState } from '../redis';
import { CacheService, CacheKeys } from '../utils/cache';
import { env, CACHE_TTL } from '../config/env';

interface User{
    id:number,
    email:string,
    fullName?:string,
}

export interface AuthenticatedRequest extends Request {
    cookies: Record<string, string>;
    user?: User;
}

export const authenticateAndRequireMeetingUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
            return;
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { id?: number; jti?: string };

        if (!decoded || !decoded.id || !decoded.jti) {
            res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
            return;
        }

        const userCacheKey = CacheKeys.meetingUser(decoded.id);
        
        // Try to get user from cache first
        const cachedUser = await CacheService.get<{ id: number; email: string }>(userCacheKey);
        
        if (cachedUser) {
            // Cached-user path: auth checks in 1 Redis RTT
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

        // Miss path: run auth state check
        const { blacklisted, session } = await getAuthState<{ id: number }>(decoded.jti);

        if (blacklisted) {
            res.status(401).json({ success: false, message: "Unauthorized - Token revoked" });
            return;
        }

        if (!session || session.id !== decoded.id) {
            res.status(401).json({ success: false, message: "Unauthorized - Session expired" });
            return;
        }

        // Cache user for future requests
        const user = { id: decoded.id, email: decoded.email || '' };
        await CacheService.set(userCacheKey, user, CACHE_TTL.LONG);
        
        req.user = user;
        next();
    } catch (error: any) {
        console.error("Error in authenticateAndRequireMeetingUser middleware:", error);
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

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: result.error.errors 
        });
      }
      (req as any).body = result.data;
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
  };
};

export const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: result.error.errors 
        });
      }
      (req as any).query = result.data;
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
  };
};