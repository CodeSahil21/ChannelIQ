import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  registers: [register]
});

export const meetingsCreated = new client.Counter({
  name: 'meetings_created_total',
  help: 'Total meetings created',
  registers: [register]
});

export const activeConnections = new client.Gauge({
  name: 'meeting_service_active_websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

export { register };