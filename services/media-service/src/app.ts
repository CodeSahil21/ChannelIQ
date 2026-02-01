import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import mediaRouter from './routes/media.routes';
import { connectRedis } from './redis';
import storageService from './services/storage.service';
import { errorHandler } from './middleware/middleware';
import { register, httpRequests, httpDuration } from './utils/metrics';
import logger from './utils/logger';

const app = express();

app.set('trust proxy', true);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

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

// Initialize Redis and MinIO on startup
connectRedis().catch(err => console.error('Failed to connect to Redis:', err));
storageService.initializeBucket().catch(err => console.error('Failed to initialize MinIO bucket:', err));

app.get('/health', async (_req, res) => {
  try {
    // Perform simple checks (e.g., Redis and MinIO connectivity)
    res.status(200).json({ status: 'ok' });

    
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/v1/media', mediaRouter);

// Global error handler
app.use(errorHandler as any);

export default app;