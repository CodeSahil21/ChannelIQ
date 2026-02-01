import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import meetingRoutes from './routes/meeting.routes';
import { env } from './config/env';
import { register, httpRequests, httpDuration } from './utils/metrics';
import logger from './utils/logger';

const app = express();

// Trust proxy for rate limiting with ingress
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'meeting-service' });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
app.use('/api/meetings', meetingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;