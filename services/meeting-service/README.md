# Meeting Service

Enterprise-grade microservice for real-time video/audio meeting management using LiveKit Cloud. Provides secure room creation, JWT-based authentication, and role-based access control for scalable video conferencing solutions.

## Project Overview

The Meeting Service acts as a backend orchestrator for video/audio meetings, handling authentication, authorization, and room management while delegating all real-time media processing to LiveKit Cloud. This separation ensures optimal performance and scalability.

**Core Responsibilities:**
- Secure meeting room lifecycle management (create, start, end, cancel)
- JWT-based authentication and authorization
- Role-based permissions (HOST, CO_HOST, PARTICIPANT)
- LiveKit access token generation with appropriate grants
- Password protection and invite token management
- Event publishing for system-wide notifications

**Why LiveKit:**
- Production-ready WebRTC infrastructure
- Global edge network for low-latency media
- Automatic scaling and load balancing
- Advanced features (screen sharing, recording, transcription)
- Eliminates complex media server management

## High-Level Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│ API Gateway │───▶│   Meeting   │───▶│   LiveKit   │
│             │    │             │    │   Service   │    │    Cloud    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │ PostgreSQL  │
                                      │  Database   │
                                      └─────────────┘
```

**Request Flow:**
1. Client authenticates via Auth Service (JWT in HTTP-only cookies)
2. API Gateway validates JWT and routes to Meeting Service
3. Meeting Service validates permissions and business rules
4. Database operations for meeting state management
5. LiveKit token generation with role-based permissions
6. Client connects directly to LiveKit Cloud for media

**Trust Boundaries:**
- Frontend: Untrusted, receives only necessary data
- API Gateway: JWT validation and rate limiting
- Meeting Service: Business logic and authorization
- LiveKit Cloud: Media processing with signed tokens

## Features

### Core Meeting Management
- **Secure Room Creation**: UUID-based meeting IDs with unique invite tokens
- **Lifecycle Management**: SCHEDULED → LIVE → ENDED/CANCELLED state transitions
- **Access Control**: Password protection and invite token validation
- **Role-Based Permissions**: HOST (full control), CO_HOST (limited admin), PARTICIPANT (view/join)

### Security Features
- **JWT Authentication**: HTTP-only cookies, no localStorage exposure
- **Password Protection**: bcrypt hashing with configurable cost factor
- **Rate Limiting**: Join attempts (10/15min), password attempts (5/15min)
- **Input Validation**: Zod schemas for all endpoints
- **CORS Protection**: Configurable origin whitelist

### LiveKit Integration
- **Token Generation**: Short-lived (10min) JWT tokens with role-specific grants
- **Permission Mapping**: Granular media permissions based on participant role
- **Room Isolation**: Meeting ID as LiveKit room name for complete separation

### Event-Driven Architecture
- **Kafka Integration**: Publishes meeting events for system-wide notifications
- **Event Types**: MEETING_CREATED, MEETING_STARTED, MEETING_ENDED, PARTICIPANT_JOINED

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime environment |
| **Language** | TypeScript | Type safety and developer experience |
| **Framework** | Express.js | HTTP server and middleware |
| **Database** | PostgreSQL | Persistent data storage |
| **ORM** | Prisma | Type-safe database operations |
| **Authentication** | JWT | Stateless authentication tokens |
| **Password Hashing** | bcryptjs | Secure password storage |
| **Validation** | Zod | Runtime type validation |
| **Rate Limiting** | express-rate-limit | API protection |
| **Security** | Helmet | HTTP security headers |
| **Real-time Media** | LiveKit Cloud | WebRTC infrastructure |
| **Message Queue** | Kafka | Event-driven communication |
| **Caching** | Redis | Session and token caching |

## Environment Variables

### Required Variables

```env
# Server Configuration
PORT=3005
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Authentication
JWT_SECRET=your-256-bit-secret-key

# LiveKit Configuration (SENSITIVE)
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_WS_URL=wss://your-project.livekit.cloud

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
REDIS_USE_TLS=true

# Kafka Configuration
KAFKA_CLIENT_ID=meeting-service
KAFKA_BROKER=your-kafka-broker:9092
KAFKA_CONSUMER_GROUP_ID=meeting-service-group

# CORS
FRONTEND_URLS=https://your-frontend-domain.com,https://admin.your-domain.com
```

### Security Notes
- **Never expose** `LIVEKIT_API_SECRET` to frontend
- Use strong, randomly generated `JWT_SECRET` (256-bit minimum)
- Enable TLS for Redis in production
- Restrict `FRONTEND_URLS` to trusted domains only

## API Documentation

### Authentication
All protected endpoints require JWT token in HTTP-only cookie named `token`.

**Headers:**
```
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Meeting Management

#### Create Meeting
```http
POST /api/meetings
Authorization: Required
```

**Request Body:**
```json
{
  "title": "Team Standup",
  "description": "Daily team synchronization",
  "scheduledAt": "2024-01-15T10:00:00Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Meeting created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Team Standup",
    "inviteToken": "abc123def456",
    "status": "SCHEDULED",
    "scheduledAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Search Meeting (Public)
```http
GET /api/meetings/search/{meetingId}
Authorization: Required
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Team Standup",
    "status": "SCHEDULED",
    "passwordEnabled": true,
    "scheduledAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Join Meeting
```http
POST /api/meetings/{id}/join
Authorization: Required
Rate Limited: 10 requests/15min
```

**Request Body:**
```json
{
  "inviteToken": "abc123def456",
  "password": "optional-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Joined meeting successfully",
  "data": {
    "role": "PARTICIPANT"
  }
}
```

#### Generate LiveKit Token
```http
GET /api/meetings/{id}/livekit-token
Authorization: Required
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "wsUrl": "wss://your-project.livekit.cloud"
  }
}
```

#### Start Meeting
```http
POST /api/meetings/{id}/start
Authorization: Required (HOST or CO_HOST only)
```

#### End Meeting
```http
POST /api/meetings/{id}/end
Authorization: Required (HOST only)
```

### Password Management

#### Set Password
```http
PUT /api/meetings/{id}/password
Authorization: Required (HOST only)
Rate Limited: 5 requests/15min
```

**Request Body:**
```json
{
  "password": "secure-meeting-password"
}
```

#### Remove Password
```http
DELETE /api/meetings/{id}/password
Authorization: Required (HOST only)
```

### Role Management

#### Promote to Co-Host
```http
POST /api/meetings/{id}/promote
Authorization: Required (HOST only)
```

**Request Body:**
```json
{
  "userId": 12345
}
```

#### Demote Co-Host
```http
POST /api/meetings/{id}/demote
Authorization: Required (HOST only)
```

### Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**Authorization Error (403):**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

**Rate Limit Error (429):**
```json
{
  "success": false,
  "message": "Too many join attempts, please try again later"
}
```

## Authentication & Security

### JWT Validation Flow
1. Extract JWT from HTTP-only cookie
2. Verify signature using `JWT_SECRET`
3. Validate expiration and claims
4. Attach user context to request object

### API Secret Protection
- LiveKit API secret never transmitted to frontend
- Token generation happens server-side only
- Short-lived tokens (10 minutes) minimize exposure
- Role-based permissions enforced at token level

### Security Best Practices
- **Password Hashing**: bcrypt with cost factor 12
- **Rate Limiting**: Prevents brute force attacks
- **Input Sanitization**: Zod validation on all inputs
- **CORS Configuration**: Strict origin validation
- **Security Headers**: Helmet middleware protection
- **SQL Injection Prevention**: Prisma ORM parameterized queries

## LiveKit Integration

### Token Signing Process
```typescript
const token = new AccessToken(apiKey, apiSecret, {
  identity: userId.toString(),
  ttl: '10m'
});

const grant = {
  roomJoin: true,
  room: meetingId,
  canPublish: role === 'HOST' || role === 'CO_HOST',
  canSubscribe: true,
  roomAdmin: role === 'HOST'
};

token.addGrant(grant);
return await token.toJwt();
```

### Permission Mapping

| Role | Room Join | Publish Media | Subscribe | Publish Data | Room Admin |
|------|-----------|---------------|-----------|--------------|------------|
| **HOST** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CO_HOST** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **PARTICIPANT** | ✅ | ❌* | ✅ | ❌ | ❌ |

*Can be enabled via meeting settings

### Common Integration Pitfalls
- **Token Expiration**: Always check token validity before LiveKit connection
- **Room Names**: Use meeting ID as room name for isolation
- **Identity Conflicts**: Ensure unique identity per participant
- **Permission Mismatches**: Verify role permissions match business requirements

## Database Schema

### Meeting Table
```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  host_id INTEGER NOT NULL,
  status meeting_status DEFAULT 'SCHEDULED',
  invite_token VARCHAR(255) UNIQUE NOT NULL,
  invite_expires_at TIMESTAMP,
  password_hash VARCHAR(255),
  password_enabled BOOLEAN DEFAULT FALSE,
  scheduled_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

CREATE INDEX idx_meetings_host_id ON meetings(host_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_invite_token ON meetings(invite_token);
```

### Meeting Participants Table
```sql
CREATE TABLE meeting_participants (
  id SERIAL PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  role participant_role DEFAULT 'PARTICIPANT',
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_participants_user_id ON meeting_participants(user_id);
```

### Data Separation
- **Meeting Service Stores**: Meeting metadata, participants, permissions
- **LiveKit Manages**: Media streams, connection state, real-time events
- **No Duplication**: Clear ownership boundaries prevent data inconsistency

## Error Handling

### Standard Error Format
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific validation error"
    }
  ]
}
```

### Error Categories

**Business Logic Errors (400):**
- Meeting lifecycle violations
- Role permission conflicts
- Password validation failures

**Authentication Errors (401):**
- Missing or invalid JWT tokens
- Expired authentication

**Authorization Errors (403):**
- Insufficient role permissions
- Meeting access denied

**Resource Errors (404):**
- Meeting not found
- Invalid meeting ID

**Rate Limit Errors (429):**
- Too many join attempts
- Password brute force protection

**Server Errors (500):**
- Database connection failures
- LiveKit service unavailable
- Unexpected system errors

## Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- LiveKit Cloud account

### Installation Steps

1. **Clone and Install Dependencies**
   ```bash
   cd services/meeting-service
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   ```bash
   curl http://localhost:3005/health
   # Expected: {"status":"OK","service":"meeting-service"}
   ```

### Development Scripts
```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production build
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
```

## Production Considerations

### Scaling Strategy
- **Horizontal Scaling**: Stateless design supports multiple instances
- **Database Optimization**: Connection pooling and read replicas
- **Caching Layer**: Redis for session and token caching
- **Load Balancing**: Round-robin with health checks

### Environment Separation
```bash
# Development
NODE_ENV=development
LIVEKIT_WS_URL=ws://localhost:7880

# Staging
NODE_ENV=staging
LIVEKIT_WS_URL=wss://staging-project.livekit.cloud

# Production
NODE_ENV=production
LIVEKIT_WS_URL=wss://production-project.livekit.cloud
```

### Secrets Management
- Use AWS Secrets Manager or HashiCorp Vault
- Rotate LiveKit API keys regularly
- Implement secret versioning and rollback
- Never commit secrets to version control

### Monitoring & Observability
```bash
# Health Check Endpoint
GET /health

# Metrics to Monitor
- Meeting creation rate
- Join success/failure ratio
- Token generation latency
- Database connection pool usage
- LiveKit API response times
```

### Logging Strategy
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "meeting-service",
  "event": "meeting_created",
  "meetingId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": 12345,
  "duration": 45
}
```

## Folder Structure

```
src/
├── config/           # Environment and configuration
│   ├── db.ts        # Database connection
│   ├── env.ts       # Environment validation
│   └── index.ts     # Configuration exports
├── controllers/      # HTTP request handlers
│   └── meeting.controller.ts
├── middleware/       # Express middleware
│   └── auth.ts      # JWT authentication
├── routes/          # API route definitions
│   └── meeting.routes.ts
├── services/        # Business logic layer
│   ├── meeting.service.ts
│   └── livekit.service.ts
├── kafka/           # Event publishing
│   ├── kafkaManager.ts
│   └── publisher.ts
├── utils/           # Utility functions
│   ├── validation.ts # Zod schemas
│   └── cache.ts     # Redis operations
├── types/           # TypeScript definitions
│   └── index.ts
├── app.ts           # Express application
├── server.ts        # HTTP server
└── redis.ts         # Redis client
```

### Key Directories
- **controllers/**: HTTP request/response handling
- **services/**: Core business logic and external integrations
- **middleware/**: Authentication, validation, rate limiting
- **config/**: Environment variables and database configuration
- **kafka/**: Event-driven communication with other services

## Future Improvements

### Recording & Playback
- **LiveKit Recording**: Automatic cloud recording with S3 storage
- **Playback API**: On-demand access to recorded meetings
- **Transcription**: AI-powered meeting transcripts
- **Highlights**: Key moment extraction and summarization

### Advanced Features
- **Webhooks**: Real-time event notifications to external systems
- **Analytics Dashboard**: Meeting usage metrics and insights
- **Moderation Tools**: Content filtering and participant management
- **Breakout Rooms**: Sub-meeting creation and management

### Integration Enhancements
- **Calendar Integration**: Google Calendar, Outlook synchronization
- **SSO Support**: SAML, OAuth2 enterprise authentication
- **API Gateway**: GraphQL federation for unified API
- **Mobile SDK**: Native iOS/Android meeting applications

### Performance Optimizations
- **Database Sharding**: Horizontal partitioning for scale
- **CDN Integration**: Global content delivery for static assets
- **Edge Computing**: Regional meeting service deployment
- **Caching Strategy**: Multi-layer caching with invalidation