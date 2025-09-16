import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Simple logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API Gateway is healthy',
        timestamp: new Date().toISOString()
    });
});

// Auth Service Proxy
app.use('/api/auth', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/api/v1/auth'
    },
    onProxyReq: (proxyReq, req) => {
        console.log(`→ Auth: ${req.method} ${req.path} → /api/v1/auth${req.path.replace('/api/auth', '')}`);
    },
    onProxyRes: (proxyRes, req) => {
        console.log(`← Auth: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error(`❌ Auth proxy error:`, err.message);
        if (!res.headersSent) {
            res.status(502).json({ 
                success: false, 
                message: 'Auth service unavailable' 
            });
        }
    }
}));

// User Management Service Proxy - FIXED PATH
app.use('/api/users', createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: {
        '^/api/users': '/api/v1/user-management' // Match your actual route
    },
    onProxyReq: (proxyReq, req) => {
        console.log(`→ Users: ${req.method} ${req.path} → /api/v1/user-management${req.path.replace('/api/users', '')}`);
    },
    onProxyRes: (proxyRes, req) => {
        console.log(`← Users: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error(`❌ Users proxy error:`, err.message);
        if (!res.headersSent) {
            res.status(502).json({ 
                success: false, 
                message: 'User service unavailable' 
            });
        }
    }
}));

// Add this new proxy for connections
app.use('/api/connections', createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: {
        '^/api/connections': '/api/v1/connections'
    },
    onProxyReq: (proxyReq, req) => {
        console.log(`→ Connections: ${req.method} ${req.path} → /api/v1/connections${req.path.replace('/api/connections', '')}`);
    },
    onProxyRes: (proxyRes, req) => {
        console.log(`← Connections: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error(`❌ Connections proxy error:`, err.message);
        if (!res.headersSent) {
            res.status(502).json({ 
                success: false, 
                message: 'Connection service unavailable' 
            });
        }
    }
}));

// Catch-all
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    console.log(`🔗 Proxying:`);
    console.log(`   /api/auth/* → http://localhost:3001/api/v1/auth/*`);
    console.log(`   /api/users/* → http://localhost:3002/api/v1/user-management/*`);
});

export default app;