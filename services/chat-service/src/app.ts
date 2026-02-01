import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import prisma from './db';
import { connectRedis, redis } from './redis';
import groupRouter from './routes/group.route';
import messageRouter from './routes/message.route';
import { config } from './utils/config';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { ApiResponse } from './utils/apiResponse';
import { register, httpRequests, httpDuration } from './utils/metrics';
import logger from './utils/logger';

const app = express();

app.set('trust proxy', true);
app.use(helmet());
app.use(compression());
app.disable('x-powered-by');

if (config.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequests.inc({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
    httpDuration.observe({ method: req.method, route: req.route?.path || req.path }, duration);
    logger.info('HTTP Request', { method: req.method, url: req.url, status: res.statusCode, duration });
  });
  next();
});

app.get('/health', async (_req, res) => {
  try {
    let dbStatus = false;
    try {
      await prisma.$connect();
      dbStatus = true;
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
    }
    
    let redisStatus = false;
    try {
      await connectRedis();
      await redis.ping();
      redisStatus = true;
    } catch (redisError) {
      console.error('Redis health check failed:', redisError);
    }
    
    const overallStatus = dbStatus && redisStatus;
    const healthData = {
      status: overallStatus ? 'healthy' : 'degraded',
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    };
    
    const response = new ApiResponse(overallStatus ? 200 : 503, healthData, overallStatus ? 'Service healthy' : 'Service degraded');
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

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Register routes
app.use('/api/groups', groupRouter);
app.use('/api/groups', messageRouter);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;