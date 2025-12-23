import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { isKafkaHealthy } from './kafka/kafkaManager';
import prisma from './db';
import userManagementRouter from './routes/profile.routes';
import connectionrouter from './routes/connection.routes';
import { connectRedis } from './redis';

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use('/api/v1/user-management', userManagementRouter);
app.use('/api/v1/connections', connectionrouter);
// Initialize Redis on startup
connectRedis().catch(err => console.error('Failed to connect to Redis:', err));

app.get('/health', async (_req, res) => {
  try {
    const kafkaStatus = await isKafkaHealthy();
    
    // Add database health check
    let dbStatus = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = true;
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
    }
    
    const overallStatus = kafkaStatus && dbStatus;
    
    res.status(overallStatus ? 200 : 503).json({ 
      status: overallStatus ? 'healthy' : 'degraded',
      services: {
        kafka: kafkaStatus ? 'connected' : 'disconnected',
        database: dbStatus ? 'connected' : 'disconnected'
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


// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    success:false,
    msg: 'Internal Server Error' });
});

export default app;