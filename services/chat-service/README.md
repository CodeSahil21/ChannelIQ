# Chat Service

## Service Overview

The Chat Service is a real-time messaging microservice designed for WhatsApp-like group communication. It handles instant message delivery, group management, user presence, and message status tracking across multiple concurrent users.

**Core Problems Solved:**
- Real-time bidirectional communication between clients
- Horizontal scaling of WebSocket connections via Redis Pub/Sub
- Message persistence with delivery guarantees
- Group-based authorization and membership management
- Cross-instance message broadcasting

**Why Socket.IO over HTTP:**
- Persistent connections eliminate connection overhead
- Sub-millisecond message delivery vs HTTP polling latency
- Built-in fallback mechanisms (polling → WebSocket)
- Automatic reconnection and acknowledgment handling

**Service Responsibilities:**
- WebSocket connection management and authentication
- Real-time message broadcasting within groups
- Message persistence and status tracking
- Group membership and permission enforcement
- Cross-instance coordination via Redis
- Poll creation and voting within groups
- Message reactions and read receipts
- Announcement broadcasting and pinned messages
- Bulk message processing via Kafka events

## Tech Stack

**Node.js + TypeScript (Strict Mode)**
- Event-driven architecture optimal for I/O-heavy operations
- TypeScript provides compile-time safety for complex message routing
- Strict mode prevents runtime type errors in production

**Express Framework**
- RESTful API for group management and message history
- Middleware pipeline for authentication and validation
- Integration with existing microservice ecosystem

**Socket.IO**
- WebSocket abstraction with automatic fallbacks
- Built-in room management for group-based messaging
- Redis adapter for horizontal scaling
- Acknowledgment system for delivery guarantees

**Redis (Pub/Sub + Caching)**
- Cross-instance message broadcasting
- User session and group membership caching
- Sub-millisecond latency for real-time requirements
- Horizontal scaling without sticky sessions

**PostgreSQL + Prisma**
- ACID compliance for message ordering and consistency
- Complex relational queries for group permissions
- Prisma provides type-safe database operations

**Kafka Integration**
- Event streaming for user management events
- Media file upload/delete event handling
- Bulk message processing for high throughput
- Cross-service communication and data synchronization

**JWT + HTTP-Only Cookies**
- Secure token storage (immune to XSS)
- Automatic CSRF protection
- Seamless integration with API Gateway

## High-Level Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Client    │    │   Client    │
│ (WebSocket) │    │ (WebSocket) │    │ (WebSocket) │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                ┌─────────▼─────────┐
                │   API Gateway     │
                │   (Port 4000)     │
                │ /api/chat/* → REST│
                │ /socket.io → WS   │
                └─────────┬─────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │Chat Svc #1│   │Chat Svc #2│   │Chat Svc #3│
    │(Port 3004)│   │(Port 3005)│   │(Port 3006)│
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                ┌─────────▼─────────┐
                │      Redis        │
                │   Pub/Sub + Cache │
                └─────────┬─────────┘
                          │
                ┌─────────▼─────────┐
                │   PostgreSQL      │
                │   (Message Store) │
                └───────────────────┘
```

**Message Flow:**
1. Client connects via API Gateway WebSocket proxy
2. Socket.IO authenticates via JWT cookie
3. User joins group rooms based on membership
4. Messages broadcast to local room + Redis Pub/Sub
5. Other instances receive via Redis and emit to their clients

## Data Models (Conceptual)

**User**
- Numeric ID (performance optimization)
- Profile information cached in Redis
- JWT session mapping for authentication

**Group**
- UUID primary key (microservice isolation)
- Privacy settings and member limits
- Creator permissions and admin hierarchy

**GroupMember**
- Composite key (userId + groupId)
- Role-based permissions (ADMIN, CO_ADMIN, MEMBER)
- Mute settings and join timestamps

**Message**
- UUID primary key (distributed system safety)
- Content, type (TEXT, IMAGE, VIDEO, FILE, POLL, ANNOUNCEMENT)
- Reply threading and file attachments
- Soft deletion for audit trails

**MessageStatus**
- Per-user delivery tracking (SENT, DELIVERED, READ)
- Bulk creation for group members
- Real-time status updates via Socket.IO

**Poll & PollOption**
- Relational poll system with voting options
- Multiple choice support and expiration dates
- Vote tracking per user with real-time updates

**MessageReaction**
- Emoji reactions on messages
- Per-user reaction tracking
- Real-time reaction broadcasting

**PinnedMessage**
- Admin-controlled message pinning
- Maximum 4 pinned messages per group
- Chronological pinning history

**Socket Connection Mapping**
- userId → socketId[] (multiple devices)
- socketId → groupId[] (active rooms)
- Cached in Redis for cross-instance lookup

**UUID vs Numeric IDs:**
- UUIDs for entities crossing service boundaries (groups, messages)
- Numeric IDs for internal references (users, optimized joins)

## REST API Documentation

### Authentication
All endpoints require JWT cookie authentication via `authenticateAndRequireChatUser` middleware.

### Group Management

**POST /groups/create**
```typescript
interface CreateGroupRequest {
  name: string;
  description?: string;
  isPrivate?: boolean;
  imageUrl?: string;
  maxMembers?: number; // default: 256
}

interface CreateGroupResponse {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  maxMembers: number;
  creatorId: number;
  members: GroupMemberResponse[];
}
```

**GET /groups/my-groups**
```typescript
interface MyGroupsResponse {
  id: string;
  userId: number;
  groupId: string;
  role: GroupRole;
  joinedAt: Date;
  group: {
    id: string;
    name: string;
    imageUrl: string | null;
    _count: { members: number };
  };
}[]
```

**GET /groups/:groupId**
```typescript
interface GroupDetailResponse {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  maxMembers: number;
  creator: UserBasic;
  members: GroupMemberResponse[];
  _count: { members: number };
}
```

### Message Operations

**GET /groups/:groupId/messages**
```typescript
interface GetMessagesQuery {
  limit?: number; // default: 50
  cursor?: string; // UUID for pagination
}

interface MessageResponse {
  id: string;
  content: string | null;
  type: MessageType;
  fileUrl: string | null;
  senderId: number;
  createdAt: Date;
  sender: UserBasic;
  replyTo?: MessageResponse;
}[]
```

### Member Management

**POST /groups/:groupId/invite**
```typescript
interface InviteUserRequest {
  targetUserId: number;
  message?: string;
}
```

**PUT /groups/:groupId/members/:userId/role**
```typescript
interface UpdateRoleRequest {
  role: 'ADMIN' | 'CO_ADMIN' | 'MEMBER';
}
```

**DELETE /groups/:groupId/members/:userId**
- Remove member from group (admin only)
- Self-leave functionality

**PUT /groups/:groupId/settings**
```typescript
interface UpdateMemberSettingsRequest {
  isMuted?: boolean;
  muteUntil?: string | null;
}
```

### Poll Management

**POST /groups/:groupId/polls**
```typescript
interface CreatePollRequest {
  question: string;
  options: string[];
  allowMultiple?: boolean;
  expiresAt?: string;
}
```

**GET /polls/:messageId**
- Get poll details with current vote counts
- User's voting status included

**DELETE /polls/:messageId**
- Delete poll (creator or admin only)

### Message Features

**POST /groups/:groupId/messages/:messageId/pin**
- Pin message (admin only)
- Maximum 4 pinned messages per group

**DELETE /groups/:groupId/messages/:messageId/pin**
- Unpin message (admin only)

**GET /groups/:groupId/messages/pinned**
- Get all pinned messages for group

**POST /groups/:groupId/announcements**
```typescript
interface CreateAnnouncementRequest {
  title: string;
  content: string;
}
```

**GET /groups/:groupId/announcements**
- Get recent announcements (last 5 days)

**Error Responses:**
- 401: Invalid/expired JWT
- 403: Insufficient permissions
- 404: Group/user not found
- 409: Conflict (already member, max capacity)

## Socket.IO Architecture

### Connection Flow

1. **Handshake Authentication**
   ```typescript
   // Cookie extraction and JWT verification
   const token = cookie.parse(socket.handshake.headers.cookie).token;
   const payload = jwt.verify(token, JWT_SECRET);
   ```

2. **User Session Setup**
   ```typescript
   socket.user = await getUserById(payload.id);
   socket.join(`user:${socket.user.id}`);
   ```

3. **Group Room Joining**
   ```typescript
   const memberships = await getUserGroups(socket.user.id);
   memberships.forEach(({ groupId }) => {
     socket.join(`group:${groupId}`);
   });
   ```

### Event Documentation

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `group:join` | C→S | `{groupId: string}` | Join group room for real-time updates |
| `message:send` | C→S | `MessageData` | Send message to group |
| `message:persisted` | S→C | `MessageWithRelations` | Broadcast new message to group |
| `message:read` | C→S | `{messageId: string, groupId: string}` | Mark message as read |
| `message:delivered` | S→C | `{messageId: string, userId: number}` | Delivery confirmation |
| `user:typing` | C→S | `{groupId: string, isTyping: boolean}` | Typing indicator |
| `typing:updated` | S→C | `{userId: number, isTyping: boolean}` | Broadcast typing status |
| `message:reaction:add` | C→S | `{messageId: string, emoji: string}` | Add reaction to message |
| `message:reaction:remove` | C→S | `{messageId: string, emoji: string}` | Remove reaction from message |
| `reaction:updated` | S→C | `{messageId: string, emoji: string, action: 'add'|'remove'}` | Broadcast reaction change |
| `poll:vote` | C→S | `{pollId: string, optionId: string}` | Vote on poll option |
| `poll:vote:update` | S→C | `{pollId: string, optionId: string, voteCount: number}` | Broadcast vote update |
| `message:edit` | C→S | `{messageId: string, content: string}` | Edit sent message |
| `message:delete` | C→S | `{messageId: string}` | Delete sent message |
| `message:updated` | S→C | `{messageId: string, content?: string, isDeleted: boolean}` | Broadcast message changes |
| `message:optimistic` | S→C | `MessageWithRelations` | Optimistic message update (bulk mode) |

### Message Broadcasting Strategy

```typescript
// Local room broadcast + Redis Pub/Sub
io.to(`group:${groupId}`).emit('message:persisted', message);
await redis.publish(`chat:${groupId}`, JSON.stringify({
  type: 'message:persisted',
  data: message,
  instanceId: process.pid
}));
```

### Socket Authentication Middleware

```typescript
export const verifySocketAuth = async (socket: Socket, next: Function) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const token = cookies.token;
    const payload = jwt.verify(token, JWT_SECRET);
    
    socket.user = await getUserFromCache(payload.id);
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};
```

## Redis Pub/Sub Design

### Scaling Problem Without Redis

Single instance Socket.IO works perfectly, but horizontal scaling breaks message delivery:

```
User A (Instance 1) → Message → Only users on Instance 1 receive
User B (Instance 2) → Never receives the message
```

### Redis Pub/Sub Solution

**Channel Strategy:**
- `chat:{groupId}` - Group-specific messages
- `user:{userId}` - Direct user notifications
- `system:broadcast` - Service-wide announcements

**Message Format:**
```typescript
interface RedisMessage {
  type: string;           // Socket event name
  room: string;           // Target room
  data: any;              // Event payload
  instanceId: string;     // Prevent echo
  timestamp: number;      // Ordering/debugging
}
```

**Cross-Instance Flow:**
1. Instance A receives Socket message
2. Instance A broadcasts to local room
3. Instance A publishes to Redis channel
4. Instances B,C,D receive Redis message
5. Instances B,C,D broadcast to their local rooms
6. All connected users receive message

**Latency Characteristics:**
- Local broadcast: <1ms
- Redis Pub/Sub: 1-5ms
- Total cross-instance: <10ms
- Acceptable for real-time chat

**Failure Scenarios:**
- Redis down: Messages still work within single instance
- Instance crash: Users reconnect to healthy instances
- Network partition: Redis handles reconnection automatically

## Message Delivery & Latency Strategy

### Delivery Guarantees

**Optimistic Delivery:**
1. Client sends message via Socket.IO
2. Server immediately broadcasts to group (optimistic)
3. Server persists to database (background)
4. Acknowledgment sent to sender

**Delivery Confirmation:**
```typescript
// Client receives immediate feedback
socket.emit('message:send', messageData, (response) => {
  if (response.success) {
    // Message queued for delivery
    showOptimisticMessage(response.messageId);
  }
});
```

**Read Receipts:**
- Per-message, per-user tracking
- Bulk status updates for performance
- Real-time broadcast to senders

### Offline User Handling

**Message Persistence:**
- All messages stored regardless of online status
- Pagination API for message history
- Push notifications via separate service

**Reconnection Strategy:**
1. Client reconnects with last seen message ID
2. Server sends missed messages via REST API
3. Socket.IO resumes real-time updates
4. Duplicate detection via message IDs

### Latency Optimization

**Database Write Timing:**
- Messages persisted after Socket broadcast (speed priority)
- Bulk MessageStatus creation (performance)
- Redis caching for frequent queries

**Connection Pooling:**
- Prisma connection pooling
- Redis connection reuse
- HTTP keep-alive for REST APIs

## Security Model

### Cookie-Based JWT Authentication

**Advantages over localStorage:**
- Automatic CSRF protection via SameSite cookies
- Immune to XSS token theft
- Automatic inclusion in Socket.IO handshake

**Cookie Configuration:**
```typescript
res.cookie('token', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

### Socket.IO Security

**Connection Authentication:**
- JWT verification on every connection
- User context attached to socket instance
- Automatic disconnection on invalid tokens

**Authorization Checks:**
```typescript
// Group membership verification
socket.on('message:send', async (data, callback) => {
  const membership = await verifyGroupMember(socket.user.id, data.groupId);
  if (!membership) {
    return callback({ success: false, error: 'Unauthorized' });
  }
  // Process message...
});
```

### Message Spoofing Prevention

**Sender Verification:**
- senderId automatically set from authenticated socket
- Client cannot override sender identity
- Message signatures via JWT context

**Group Authorization:**
- Real-time membership verification
- Role-based permissions (admin actions)
- Cached permissions for performance

### Rate Limiting

**Socket.IO Rate Limiting:**
```typescript
// Per-socket message rate limiting
const rateLimiter = new Map();
socket.on('message:send', (data, callback) => {
  const userId = socket.user.id;
  const now = Date.now();
  const userLimiter = rateLimiter.get(userId) || { count: 0, resetTime: now + 60000 };
  
  if (userLimiter.count > 30) { // 30 messages per minute
    return callback({ success: false, error: 'Rate limit exceeded' });
  }
});
```

**REST API Rate Limiting:**
- Express rate limiter middleware
- IP-based and user-based limits
- Exponential backoff for repeated violations

## Error Handling Strategy

### Socket Disconnect Handling

**Graceful Disconnection:**
```typescript
socket.on('disconnect', (reason) => {
  // Clean up user sessions
  SessionManager.removeUserFromAllGroups(socket.id);
  
  // Broadcast offline status
  socket.broadcast.emit('user:status', {
    userId: socket.user.id,
    status: 'offline',
    lastSeen: new Date()
  });
});
```

**Reconnection Logic:**
- Automatic Socket.IO reconnection
- Exponential backoff (1s, 2s, 4s, 8s)
- Session restoration via cached group memberships

### Redis Failure Handling

**Graceful Degradation:**
```typescript
try {
  await redis.publish(channel, message);
} catch (redisError) {
  console.error('Redis publish failed:', redisError);
  // Continue with local broadcast only
  // Service remains functional for single instance
}
```

**Cache Miss Strategy:**
- Fallback to database queries
- Background cache warming
- Circuit breaker pattern for Redis calls

### Database Failure Handling

**Connection Resilience:**
- Prisma automatic reconnection
- Connection pooling with health checks
- Read replica fallback for queries

**Transaction Rollback:**
```typescript
try {
  await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({ data: messageData });
    await tx.messageStatus.createMany({ data: statusData });
    return message;
  });
} catch (dbError) {
  // Rollback automatic, return error to client
  callback({ success: false, error: 'Database unavailable' });
}
```

### Partial Message Delivery

**Acknowledgment System:**
- Socket.IO built-in acknowledgments
- Client-side retry with exponential backoff
- Message deduplication via UUID

**Delivery Status Tracking:**
- SENT: Message accepted by server
- DELIVERED: Message broadcast to recipients
- READ: Recipient explicitly marked as read

## Environment Variables

```bash
# Server Configuration
PORT=3004
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/chat_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_USE_TLS=false

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# CORS Configuration
FRONTEND_URLS=https://app.example.com,https://admin.example.com

# Kafka (Optional)
KAFKA_CLIENT_ID=chat-service
KAFKA_BROKER=localhost:9092
KAFKA_CONSUMER_GROUP_ID=chat-service-group

# Performance Tuning
CACHE_TTL_SHORT=120
CACHE_TTL_MEDIUM=600
CACHE_TTL_LONG=1800

# Feature Flags
ENABLE_BULK_MESSAGES=false
MESSAGE_BATCH_TIMEOUT=5000
MESSAGE_MAX_BATCH_SIZE=100

# Kafka Configuration
KAFKA_CLIENT_ID=chat-service
KAFKA_BROKER=localhost:9092
KAFKA_CONSUMER_GROUP_ID=chat-service-group
KAFKA_DEBUG=false
KAFKA_REPLICATION_FACTOR=1
```

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Step-by-Step Setup

1. **Install Dependencies**
   ```bash
   cd services/chat-service
   npm install
   ```

2. **Database Setup**
   ```bash
   # Start PostgreSQL (or use Docker)
   docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:14
   
   # Copy environment file
   cp .env.example .env
   
   # Update DATABASE_URL in .env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/chat_db
   ```

3. **Run Database Migrations**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start Redis**
   ```bash
   # Local Redis
   redis-server
   
   # Or Docker
   docker run -d --name redis -p 6379:6379 redis:6-alpine
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Test Socket Connection**
   ```bash
   # Health check
   curl http://localhost:3004/health
   
   # Socket.IO test (requires authentication)
   # Use browser dev tools or Postman WebSocket client
   ```

### Development Scripts

```bash
npm run build          # TypeScript compilation
npm run start          # Production server
npm run dev            # Development with hot reload
npm run prisma:generate # Regenerate Prisma client
npm run prisma:migrate  # Run database migrations
```

## Production Considerations

### Horizontal Scaling

**Load Balancer Configuration:**
```nginx
upstream chat_service {
    server chat-service-1:3004;
    server chat-service-2:3004;
    server chat-service-3:3004;
}

server {
    location /socket.io/ {
        proxy_pass http://chat_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**No Sticky Sessions Required:**
- Redis Pub/Sub eliminates session affinity needs
- Users can connect to any instance
- Automatic failover on instance crashes

### Process Management

**PM2 Configuration:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'chat-service',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3004
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};
```

**Docker Configuration:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3004
CMD ["node", "dist/server.js"]
```

### Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  console.log('Graceful shutdown initiated...');
  
  // Stop accepting new connections
  server.close();
  
  // Flush message buffers
  await MessageBufferService.flushBuffer();
  
  // Close database connections
  await prisma.$disconnect();
  
  // Close Redis connections
  await redis.disconnect();
  
  process.exit(0);
});
```

### Monitoring & Observability

**Health Checks:**
```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  res.status(200).json(health);
});
```

**Metrics Collection:**
- Socket.IO connection count
- Message throughput (messages/second)
- Redis Pub/Sub latency
- Database query performance
- Memory usage and GC metrics

## Common Pitfalls & Design Decisions

### Why Not Pure REST?

**Real-Time Requirements:**
- HTTP polling: 1-5 second delays, high server load
- Server-Sent Events: Unidirectional, no acknowledgments
- WebSocket: Bidirectional, sub-second latency, connection reuse

**User Experience:**
- Instant message delivery
- Real-time typing indicators
- Immediate read receipts
- Live user presence

### Why Redis Over Kafka?

**Latency Requirements:**
- Redis Pub/Sub: 1-5ms latency
- Kafka: 10-100ms latency (optimized for throughput)
- Chat requires immediate delivery over guaranteed ordering

**Operational Complexity:**
- Redis: Single binary, simple clustering
- Kafka: ZooKeeper dependency, partition management
- Redis sufficient for chat-scale message volumes

### Why Socket.IO Over Native WebSocket?

**Production Reliability:**
- Automatic fallback to HTTP polling
- Built-in reconnection with exponential backoff
- Room management and broadcasting abstractions
- Cross-browser compatibility

**Developer Experience:**
- Event-based API vs raw message parsing
- Acknowledgment system built-in
- Redis adapter for scaling

### Message Persistence Timing

**Dual Processing Strategy:**
```typescript
// Bulk processing (when enabled)
if (useBulkProcessing) {
  await MessageProducer.publishMessageEvent(messageData);
  io.to(`group:${groupId}`).emit('message:optimistic', message);
} else {
  // Direct processing
  const message = await SocketMessageService.createMessage(messageData);
  io.to(`group:${groupId}`).emit('message:persisted', message);
}
```

**Bulk Message Processing:**
- Kafka events for high-throughput scenarios
- Optimistic updates for immediate user feedback
- Background batch processing with configurable timeouts
- Fallback to direct processing on Kafka failures

**Rationale:**
- User experience prioritized (immediate feedback)
- Scalable message processing for high load
- Database failures don't block real-time delivery
- Message IDs prevent duplicates on retry

## Recent Enhancements

### Kafka Integration

**Event-Driven Architecture:**
- User management events (create, update, delete)
- Media upload/delete events with file handling
- Bulk message processing for performance
- Cross-service data synchronization

**Consumer Implementation:**
```typescript
// Handle user management events
switch (event.eventType) {
  case 'USER_PROFILE_CREATED':
    await CreateUserService(event);
    break;
  case 'USER_FULLNAME_UPDATED':
    await updateUserFullName(event.userId, event.fullName);
    break;
}
```

### Enhanced Message Features

**Poll System:**
- Create polls with multiple options
- Single/multiple choice voting
- Real-time vote count updates
- Poll expiration handling

**Message Reactions:**
- Emoji reactions on messages
- Real-time reaction broadcasting
- Optimistic reaction updates

**Message Management:**
- Edit sent messages
- Delete messages (soft delete)
- Pin important messages (admin only)
- Announcement broadcasting

### Performance Optimizations

**Smart Caching:**
- Redis caching for user profiles and group memberships
- Cache-first authentication middleware
- Optimized database queries with Prisma

**Bulk Processing:**
- Configurable bulk message processing
- Kafka-based event streaming
- Background batch operations
- Graceful fallback mechanisms

## Future Improvements

### Message Search & Indexing

**Full-Text Search:**
- Elasticsearch integration for message content
- Indexed by group, sender, timestamp
- Faceted search (media only, mentions, etc.)

**Implementation Strategy:**
```typescript
// Message creation hook
await elasticsearch.index({
  index: 'messages',
  body: {
    messageId: message.id,
    groupId: message.groupId,
    content: message.content,
    senderId: message.senderId,
    timestamp: message.createdAt
  }
});
```

### Media Streaming & File Handling

**Large File Support:**
- Separate media service for file uploads
- CDN integration for global delivery
- Progressive image loading
- Video streaming with adaptive bitrate

**Message Types Extension:**
```typescript
enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  LOCATION = 'LOCATION'
}
```

### End-to-End Encryption

**Signal Protocol Integration:**
- Client-side key generation and exchange
- Server stores encrypted message blobs
- Forward secrecy with key rotation
- Minimal server-side metadata

**Architecture Impact:**
- Server cannot index encrypted content
- Push notifications require metadata encryption
- Key distribution via separate secure channel

### Presence Service

**Advanced User Status:**
- Online/Offline/Away/Busy states
- Last seen timestamps
- Typing indicators with timeout
- Active device tracking

**Scalable Implementation:**
```typescript
// Redis-based presence tracking
await redis.setex(`presence:${userId}`, 30, JSON.stringify({
  status: 'online',
  lastSeen: new Date(),
  socketIds: [socket.id]
}));
```

### Kafka Migration Path

**When to Consider Kafka:**
- Message volume >100K messages/second
- Need for message replay/audit trails
- Complex event sourcing requirements
- Integration with data analytics pipeline

**Migration Strategy:**
1. Dual-write to Redis + Kafka
2. Gradual consumer migration
3. Redis deprecation for new features
4. Full Kafka adoption

**Trade-offs:**
- Higher latency (10-100ms vs 1-5ms)
- Increased operational complexity
- Better durability and replay capabilities
- Enhanced analytics and monitoring