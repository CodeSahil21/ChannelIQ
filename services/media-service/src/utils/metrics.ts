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

export const filesUploaded = new client.Counter({
  name: 'files_uploaded_total',
  help: 'Total files uploaded',
  labelNames: ['type'],
  registers: [register]
});

export { register };