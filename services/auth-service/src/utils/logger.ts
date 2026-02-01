import winston from 'winston';
import LokiTransport from 'winston-loki';
import { env } from '../config/env';

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
  ]
});

// Add Loki transport in production or when LOKI_HOST is configured
if (env.NODE_ENV === 'production' || env.LOKI_HOST !== 'http://localhost:3100') {
  logger.add(
    new LokiTransport({
      host: env.LOKI_HOST,
      labels: { service: 'auth-service', env: env.NODE_ENV },
      json: true,
      batching: true,
      interval: 5
    })
  );
}

export default logger;