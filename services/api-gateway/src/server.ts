import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'],
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
        // remove conditional request headers to avoid downstream 304 responses
        try {
            proxyReq.removeHeader?.('if-none-match');
            proxyReq.removeHeader?.('if-modified-since');
        } catch (e) { /* ignore if not supported */ }

        console.log(`→ Auth: ${req.method} ${req.path} → /api/v1/auth${req.path.replace('/api/auth', '')}`);
    },
    onProxyRes: (proxyRes, req) => {
        // remove ETag / caching headers to avoid conditional 304 responses
        delete proxyRes.headers['etag'];
        proxyRes.headers['cache-control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
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
        '^/api/users': '/api/v1/user-management'
    },
    onProxyReq: (proxyReq, req) => {
        try {
            proxyReq.removeHeader?.('if-none-match');
            proxyReq.removeHeader?.('if-modified-since');
        } catch (e) {}
        console.log(`→ Users: ${req.method} ${req.path} → /api/v1/user-management${req.path.replace('/api/users', '')}`);
    },
    onProxyRes: (proxyRes, req) => {
        delete proxyRes.headers['etag'];
        proxyRes.headers['cache-control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
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
        try {
            proxyReq.removeHeader?.('if-none-match');
            proxyReq.removeHeader?.('if-modified-since');
        } catch (e) {}
        console.log(`→ Connections: ${req.method} ${req.path} → /api/v1/connections${req.path.replace('/api/connections', '')}`);
    },
    onProxyRes: (proxyRes, req) => {
        delete proxyRes.headers['etag'];
        proxyRes.headers['cache-control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
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

// Media Service Proxy
app.use('/api/media', createProxyMiddleware({
    target: 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
        '^/api/media': '/api/v1/media'
    },
    onProxyReq: (proxyReq, req) => {
        try {
            proxyReq.removeHeader?.('if-none-match');
            proxyReq.removeHeader?.('if-modified-since');
        } catch (e) {}
        console.log(`→ Media: ${req.method} ${req.path} → /api/v1/media${req.path.replace('/api/media', '')}`);
    },
    onProxyRes: (proxyRes, req) => {
        delete proxyRes.headers['etag'];
        proxyRes.headers['cache-control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
        console.log(`← Media: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error(`❌ Media proxy error:`, err.message);
        if (!res.headersSent) {
            res.status(502).json({ 
                success: false, 
                message: 'Media service unavailable' 
            });
        }
    }
}));

// Socket.IO Proxy for WebSocket connections
app.use('/socket.io/', createProxyMiddleware({
    target: 'http://localhost:3004',
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
    onProxyReq: (proxyReq, req) => {
        console.log(`→ Socket.IO: ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
        console.error(`❌ Socket.IO proxy error:`, err.message);
    }
}));

// Groups/Chat Service Proxy
app.use('/api/groups', createProxyMiddleware({
    target: 'http://localhost:3004',
    changeOrigin: true,
    pathRewrite: {
        '^/api/groups': '/groups'
    },
    onProxyReq: (proxyReq, req) => {
        try {
            proxyReq.removeHeader?.('if-none-match');
            proxyReq.removeHeader?.('if-modified-since');
        } catch (e) {}
        console.log(`→ Groups: ${req.method} ${req.path} → /groups${req.path.replace('/api/groups', '')}`);
    },
    onProxyRes: (proxyRes, req) => {
        delete proxyRes.headers['etag'];
        proxyRes.headers['cache-control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
        console.log(`← Groups: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error(`❌ Groups proxy error:`, err.message);
        if (!res.headersSent) {
            res.status(502).json({ 
                success: false, 
                message: 'Groups service unavailable' 
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
server.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    console.log(`🔗 Proxying:`);
    console.log(`   /api/auth/* → http://localhost:3001/api/v1/auth/*`);
    console.log(`   /api/users/* → http://localhost:3002/api/v1/user-management/*`);
    console.log(`   /api/connections/* → http://localhost:3002/api/v1/connections/*`);
    console.log(`   /api/media/* → http://localhost:3003/api/v1/media/*`);
    console.log(`   /api/groups/* → http://localhost:3004/groups/*`);
    console.log(`   /socket.io/* → http://localhost:3004/socket.io/* (WebSocket)`);
});

export default app;