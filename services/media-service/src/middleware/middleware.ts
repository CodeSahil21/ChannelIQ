import { Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthenticatedRequest } from '../utils/types';
import { getSession, isBlacklisted } from '../redis';

export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: {
    success: false,
    msg: 'Too many upload attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);

  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      msg: 'File too large'
    });
    return;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    res.status(400).json({
      success: false,
      msg: 'Too many files'
    });
    return;
  }

  if (err.message.includes('Invalid file type')) {
    res.status(400).json({
      success: false,
      msg: err.message
    });
    return;
  }

  res.status(500).json({
    success: false,
    msg: 'Internal Server Error'
  });
};