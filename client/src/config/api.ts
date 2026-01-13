/**
 * Centralized API Configuration
 * Environment-based configuration for development and production
 */

const getApiBaseUrl = (): string => {
  // Production: Use real domain
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://api.yourdomain.com';
  }
  // Development: Use local setup
  return import.meta.env.VITE_API_BASE_URL || 'https://api.corporate.local';
};

const getSocketBaseUrl = (): string => {
  // Production: Use real domain
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_SOCKET_BASE_URL || 'https://api.yourdomain.com';
  }
  // Development: Use local setup
  return import.meta.env.VITE_SOCKET_BASE_URL || 'https://api.corporate.local';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  SOCKET_URL: getSocketBaseUrl(),
  TIMEOUT: {
    DEFAULT: 10000,
    MEDIA_UPLOAD: 30000,
    USER_API: 8000,
  }
} as const;

export const DEFAULT_AXIOS_CONFIG = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  // Disable SSL verification for development
  httpsAgent: !import.meta.env.PROD ? {
    rejectUnauthorized: false
  } : undefined
} as const;