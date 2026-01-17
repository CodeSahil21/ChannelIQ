# CORS Migration to Ingress Level

## Step 1: Update Ingress Configuration

```yaml
# Updated ingress with proper CORS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: corporatechat-ingress
  namespace: corporatechat
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://your-domain.com,https://app.your-domain.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET,POST,PUT,DELETE,OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Content-Type,Authorization,Cookie,X-Requested-With"
    nginx.ingress.kubernetes.io/cors-max-age: "86400"
    # WebSocket support
    nginx.ingress.kubernetes.io/websocket-services: "chat-service,meeting-service"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
```

## Step 2: Service Modifications

### Auth Service
```typescript
// Remove CORS, keep essentials
app.set('trust proxy', 1);
app.use(cookieParser());
// Remove: app.use(cors(corsOptions));
```

### Chat Service  
```typescript
// Express app
app.set('trust proxy', 1);
app.use(cookieParser());
// Remove: app.use(cors(corsOptions));

// Socket.IO - CRITICAL CHANGE
const io: TypedServer = new Server(server, {
  // Remove CORS - let ingress handle
  allowEIO3: true,
  transports: ['websocket', 'polling']
});
```

### Meeting Service
```typescript
// Express app
app.set('trust proxy', 1);
app.use(cookieParser());
// Remove: app.use(cors(...));

// Socket.IO - CRITICAL CHANGE  
const io: TypedServer = new Server(server, {
  // Remove CORS - let ingress handle
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  path: '/meeting-socket/'
});
```

## Step 3: Testing Checklist

### REST API Tests
- [ ] Login with cookies works
- [ ] File uploads work
- [ ] Cross-origin requests work
- [ ] Preflight OPTIONS requests work

### WebSocket Tests  
- [ ] Socket.IO connection establishes
- [ ] Cookie authentication works
- [ ] Real-time messaging works
- [ ] Meeting socket connections work
- [ ] Polling fallback works

### Production Concerns
- [ ] HTTPS certificate handling
- [ ] Cookie secure flags
- [ ] Session persistence
- [ ] Load balancer sticky sessions