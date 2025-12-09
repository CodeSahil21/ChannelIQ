import { Request, Response, NextFunction } from 'express';
import { incrementCache } from '../utils/cache';

export const loginRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `ratelimit:login:${ip}`;
    
    const count = await incrementCache(key, 900); // 15 minutes
    
    if (count > 10) {
      res.status(429).json({
        success: false,
        message: "Too many login attempts. Please try again later"
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next();
  }
};

export const registerRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `ratelimit:register:${ip}`;
    
    const count = await incrementCache(key, 3600); // 1 hour
    
    if (count > 3) {
      res.status(429).json({
        success: false,
        message: "Too many registration attempts. Please try again later"
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next();
  }
};
