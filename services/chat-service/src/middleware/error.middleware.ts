import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    let error = err;

    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any;
        if (prismaError.code === 'P2002') {
            error = new ApiError(400, "Duplicate entry found");
        } else if (prismaError.code === 'P2025') {
            error = new ApiError(404, "Record not found");
        }
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError(401, "Invalid token");
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        error = new ApiError(400, "Validation failed");
    }

    const statusCode = (error as ApiError).statusCode || 500;
    const message = error.message || "Internal Server Error";

    // Log error for debugging
    if (statusCode >= 500) {
        console.error(`🚨 Server Error: ${message}`, error.stack);
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: (error as ApiError).errors || [],
        ...(process.env.NODE_ENV === "development" && { 
            stack: error.stack,
            originalError: err.name 
        }),
        timestamp: new Date().toISOString(),
        path: req.path
    });
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
};