import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Trust proxy for Kubernetes
app.set('trust proxy', 1);

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
const socketProxy = createProxyMiddleware({
    target: 'http://localhost:3004',
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
    logLevel: 'debug',
    headers: {
        'Connection': 'upgrade',
        'Upgrade': 'websocket'
    },
    onProxyReq: (proxyReq, req) => {
        console.log(`→ Socket.IO: ${req.method} ${req.path}`);
        // Forward cookies for authentication
        if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
        }
    },
    onProxyReqWs: (proxyReq, req, socket) => {
        console.log(`→ Socket.IO WS: ${req.url}`);
        // Forward cookies for WebSocket authentication
        if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
        }
    },
    onError: (err, req, res) => {
        console.error(`❌ Socket.IO proxy error:`, err.message);
    }
});

app.use('/socket.io/', socketProxy);

// Meeting Socket.IO Proxy for WebSocket connections
const meetingSocketProxy = createProxyMiddleware({
    target: 'http://localhost:3005',
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
    logLevel: 'debug',
    headers: {
        'Connection': 'upgrade',
        'Upgrade': 'websocket'
    },
    onProxyReq: (proxyReq, req) => {
        console.log(`→ Meeting Socket.IO: ${req.method} ${req.path}`);
        // Forward cookies for authentication
        if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
        }
    },
    onProxyReqWs: (proxyReq, req, socket) => {
        console.log(`→ Meeting Socket.IO WS: ${req.url}`);
        // Forward cookies for WebSocket authentication
        if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
        }
    },
    onError: (err, req, res) => {
        console.error(`❌ Meeting Socket.IO proxy error:`, err.message);
    }
});

app.use('/meeting-socket/', meetingSocketProxy);

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/socket.io/')) {
        console.log('🔌 WebSocket upgrade for Socket.IO');
        socketProxy.upgrade?.(request as any, socket as any, head);
    } else if (request.url?.startsWith('/meeting-socket/')) {
        console.log('🔌 WebSocket upgrade for Meeting Socket.IO');
        meetingSocketProxy.upgrade?.(request as any, socket as any, head);
    }
});

// Meeting Service Proxy
app.use('/api/meetings', createProxyMiddleware({
    target: 'http://localhost:3005',
    changeOrigin: true,
    pathRewrite: {
        '^/api/meetings': '/api/meetings'
    },
    onProxyReq: (proxyReq, req) => {
        try {
            proxyReq.removeHeader?.('if-none-match');
            proxyReq.removeHeader?.('if-modified-since');
        } catch (e) {}
        console.log(`→ Meetings: ${req.method} ${req.path} → /api/meetings${req.path.replace('/api/meetings', '')}`);
    },
    onProxyRes: (proxyRes, req) => {
        delete proxyRes.headers['etag'];
        proxyRes.headers['cache-control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
        console.log(`← Meetings: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error(`❌ Meetings proxy error:`, err.message);
        if (!res.headersSent) {
            res.status(502).json({ 
                success: false, 
                message: 'Meeting service unavailable' 
            });
        }
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
    console.log(`   /api/meetings/* → http://localhost:3005/api/meetings/*`);
    console.log(`   /api/groups/* → http://localhost:3004/groups/*`);
    console.log(`   /socket.io/* → http://localhost:3004/socket.io/* (WebSocket)`);
    console.log(`   /meeting-socket/* → http://localhost:3005/meeting-socket/* (WebSocket)`);
});

export default app;