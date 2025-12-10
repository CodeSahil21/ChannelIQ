import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import mediaRouter from './routes/media.routes';
import { isKafkaHealthy } from './kafka/kafkaManager';
import { connectRedis } from './redis';
import storageService from './services/storage.service';
import { errorHandler } from './middleware/middleware';

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

app.use(helmet());
app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));



// Initialize Redis and MinIO on startup
connectRedis().catch(err => console.error('Failed to connect to Redis:', err));
storageService.initializeBucket().catch(err => console.error('Failed to initialize MinIO bucket:', err));

app.get('/health', async (_req, res) => {
  try {
    const kafkaStatus = await isKafkaHealthy();
    
    res.status(kafkaStatus ? 200 : 503).json({ 
      status: kafkaStatus ? 'healthy' : 'degraded',
      services: {
        kafka: kafkaStatus ? 'connected' : 'disconnected',
        storage: 'connected' // MinIO health check can be added if needed
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

app.use('/api/v1/media', mediaRouter);

// Global error handler
app.use(errorHandler as any);

export default app;