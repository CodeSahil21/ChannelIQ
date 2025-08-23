import {  Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/db';
import { AuthenticatedRequest } from '../utils/types';


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
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {id:number};

        if (!decoded || !decoded.id) {
            res.status(401).json({ 
                success: false,
                message: "Unauthorized - Invalid token" 
            });
            return;
        }

        // Find user by ID using Prisma
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                profilePic: true
            }
        });

        if (!user) {
            res.status(401).json({ 
                success: false,
                message: "Unauthorized - User not found" 
            });
            return;
        }

        // Attach user to request object
        req.user = user;

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

