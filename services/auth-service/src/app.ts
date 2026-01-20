import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import authRouter from './routes/auth.routes'; 
import prisma from './db/db';
import { connectRedis } from './redis';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { ApiResponse } from './utils/apiResponse';

const app = express();

app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Initialize Redis on startup
connectRedis().catch(err => console.error('Failed to connect to Redis:', err));

app.get('/health', async (_req, res) => {
  try {
    let dbStatus = false;
    try {
      await prisma.$connect();
      dbStatus = true;
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
    }
    
    const healthData = {
      status: dbStatus ? 'healthy' : 'degraded',
      services: {
        database: dbStatus ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    };
    
    const response = new ApiResponse(dbStatus ? 200 : 503, healthData, dbStatus ? 'Service healthy' : 'Service degraded');
    res.status(response.statusCode).json(response);
    
  } catch (error) {
    const errorData = {
      status: 'error',
      message: 'Health check failed'
    };
    const response = new ApiResponse(503, errorData, 'Health check failed');
    res.status(response.statusCode).json(response);
  }
});


app.use('/api/v1/auth', authRouter);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;