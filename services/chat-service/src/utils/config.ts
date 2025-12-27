import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 3004,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_USERNAME: process.env.REDIS_USERNAME || '',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_USE_TLS: process.env.REDIS_USE_TLS === 'true',
  
  // Kafka
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'chat-service',
  KAFKA_BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  KAFKA_CONSUMER_GROUP_ID: process.env.KAFKA_CONSUMER_GROUP_ID || 'chat-service-group',
  KAFKA_DEBUG: process.env.KAFKA_DEBUG === 'true',
  
  // CORS
  FRONTEND_URLS: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'],
  
  // Cache TTL
  CACHE_TTL: {
    SHORT: 120,
    MEDIUM: 600,
    LONG: 1800,
    SEARCH: 300,
    SOCKET_GROUPS: 60,
  },
  
  // Validation
  validateRequired() {
    const required = ['JWT_SECRET', 'DATABASE_URL'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};

config.validateRequired();