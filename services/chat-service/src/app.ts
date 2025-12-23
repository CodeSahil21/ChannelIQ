import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import prisma from './db';
import { connectRedis, redis } from './redis';
import groupRouter from './routes/group.route';
import messageRouter from './routes/message.route';

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'], // React/Vite + API Gateway
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(helmet());
app.use(compression()); // Add compression
app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.get('/health', async (_req, res) => {
  try {
    // Add database health check
    let dbStatus = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = true;
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
    }
    
    // Add Redis health check
    let redisStatus = false;
    try {
      await connectRedis();
      await redis.ping();
      redisStatus = true;
    } catch (redisError) {
      console.error('Redis health check failed:', redisError);
    }
    
    const overallStatus = dbStatus && redisStatus;
    
    res.status(overallStatus ? 200 : 503).json({ 
      status: overallStatus ? 'healthy' : 'degraded',
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
});

// Register routes
app.use('/groups', groupRouter);
app.use('/groups', messageRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    success:false,
    msg: 'Internal Server Error' });
});

export default app;