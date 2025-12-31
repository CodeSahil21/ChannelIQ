# Meeting Service

A production-grade microservice that provides comprehensive video conferencing capabilities for enterprise applications. Built with Node.js, TypeScript, and LiveKit, this service handles meeting lifecycle management, participant authentication, role-based access control, and real-time communication features.

The service is designed for high-scale corporate environments requiring secure, reliable video conferencing with advanced participant management and integration capabilities.

## Key Features

- **Meeting Lifecycle Management** - Create, schedule, start, end, and cancel meetings
- **Role-Based Access Control** - HOST, CO_HOST, and PARTICIPANT roles with granular permissions
- **LiveKit Integration** - Professional-grade video/audio streaming with WebRTC
- **Real-Time Communication** - Socket.IO-based live updates for meeting events
- **Security Features** - JWT authentication, password protection, invite tokens with expiration
- **Participant Management** - Join/leave tracking, role promotion/demotion, mute controls
- **Event-Driven Architecture** - Kafka integration for cross-service communication
- **High Performance** - Redis caching, connection pooling, rate limiting
- **Horizontal Scaling** - Redis adapter for multi-instance Socket.IO coordination

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │  Meeting Service│
│   (React)       │◄──►│   (Express)      │◄──►│   (Node.js)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌──────────────────┐             │
                       │   LiveKit Cloud  │◄────────────┤
                       │  (Video/Audio)   │             │
                       └──────────────────┘             │
                                                         │
┌─────────────────┐    ┌──────────────────┐             │
│   PostgreSQL    │◄───│     Redis        │◄────────────┤
│  (Persistence)  │    │   (Cache/Pub)    │             │
└─────────────────┘    └──────────────────┘             │
                                                         │
┌─────────────────┐    ┌──────────────────┐             │
│   Kafka         │◄───│  Socket.IO       │◄────────────┘
│  (Events)       │    │ (Real-time)      │
└─────────────────┘    └──────────────────┘
```

**Architectural Decisions:**
- **Microservice Pattern**: Isolated meeting functionality for independent scaling
- **Event Sourcing**: Kafka events enable audit trails and cross-service integration
- **CQRS**: Separate read/write paths with Redis caching for optimal performance
- **WebRTC via LiveKit**: Offloads media processing to specialized infrastructure
- **Redis Pub/Sub**: Enables horizontal scaling of Socket.IO across instances

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.3+ |
| Framework | Express.js 4.18+ |
| Database | PostgreSQL with Prisma ORM |
| Auth | JWT with Redis session management |
| Real-Time | Socket.IO 4.7+ with Redis adapter |
| Video/Audio | LiveKit Cloud WebRTC |
| State/Cache | Redis 4.6+ |
| Message Queue | Kafka 2.2+ |
| Validation | Zod schema validation |
| Security | Helmet, CORS, rate limiting |

## Folder Structure

```
src/
├── config/          # Environment and database configuration
├── controllers/     # HTTP request handlers and business logic
├── services/        # Core business services (meeting, livekit, socket)
├── routes/          # Express route definitions with middleware
├── middleware/      # Authentication and validation middleware
├── sockets/         # Socket.IO handlers and real-time logic
├── kafka/           # Event publishing and message handling
├── utils/           # Shared utilities (cache, validation, types)
├── types/           # TypeScript type definitions
├── app.ts           # Express application setup
└── server.ts        # Server initialization and graceful shutdown
```

## Authentication & Authorization

**JWT Token Flow:**
- Tokens issued by auth-service with user claims
- Redis-based session validation with blacklist support
- Cookie-based transport with httpOnly and secure flags

**Role-Based Access Control:**
- **HOST**: Full meeting control, participant management, meeting lifecycle
- **CO_HOST**: Participant management, mute controls (max 3 per meeting)
- **PARTICIPANT**: Basic meeting access, request unmute capability

**Security Features:**
- Rate limiting on join attempts (10/15min) and password attempts (5/15min)
- Invite token expiration and single-use validation
- Password hashing with bcrypt (12 rounds)
- CORS protection with configurable origins

## API Documentation

### Meeting Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/meetings` | Required | Create new meeting |
| GET | `/api/meetings` | Required | Get user's meetings (paginated) |
| GET | `/api/meetings/:id` | Required | Get meeting details |
| PUT | `/api/meetings/:id` | Required | Update meeting (HOST only) |
| DELETE | `/api/meetings/:id` | Required | Cancel meeting (HOST only) |

### Meeting Lifecycle

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/meetings/:id/start` | Required | Start scheduled meeting |
| POST | `/api/meetings/:id/end` | Required | End live meeting (HOST only) |
| POST | `/api/meetings/:id/join` | Required | Join meeting with credentials |
| POST | `/api/meetings/:id/leave` | Required | Leave meeting |

### LiveKit Integration

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/meetings/:id/livekit-token` | Required | Get WebRTC access token |

### Participant Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/meetings/:id/promote` | Required | Promote to CO_HOST (HOST only) |
| POST | `/api/meetings/:id/demote` | Required | Demote CO_HOST (HOST only) |

### Security Features

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/api/meetings/:id/password` | Required | Set meeting password (HOST only) |
| DELETE | `/api/meetings/:id/password` | Required | Remove password (HOST only) |
| GET | `/api/meetings/:id/password/status` | Required | Check password requirement |

**Request/Response Examples:**

```typescript
// Create Meeting
POST /api/meetings
{
  "title": "Team Standup",
  "description": "Daily team sync",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "passwordEnabled": true,
  "password": "secure123"
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid-meeting-id",
    "title": "Team Standup",
    "inviteToken": "hex-token",
    "status": "SCHEDULED"
  }
}
```

## Real-Time Events

**Socket.IO Connection:**
- Path: `/meeting-socket/`
- Authentication: JWT cookie validation
- Auto-join user-specific room: `user:{userId}`

**Meeting Room Events:**

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `joinMeetingRoom` | Client→Server | `{meetingId}` | Join meeting room |
| `leaveMeetingRoom` | Client→Server | `{meetingId}` | Leave meeting room |
| `participantJoined` | Server→Client | `ParticipantEventData` | New participant joined |
| `participantLeft` | Server→Client | `ParticipantEventData` | Participant left |
| `meetingStarted` | Server→Client | `MeetingEventData` | Meeting went live |
| `meetingEnded` | Server→Client | `MeetingEventData` | Meeting ended |

**Participant Control Events:**

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `muteParticipant` | Client→Server | `{meetingId, targetUserId}` | Mute participant (HOST/CO_HOST) |
| `unmuteParticipant` | Client→Server | `{meetingId, targetUserId}` | Unmute participant |
| `requestUnmute` | Client→Server | `{meetingId}` | Request unmute permission |
| `participantMuted` | Server→Client | `MuteEventData` | Participant was muted |
| `unmuteRequested` | Server→Client | `UnmuteRequestData` | Unmute request received |

**Scaling Strategy:**
- Redis Pub/Sub adapter enables cross-instance room synchronization
- Automatic event deduplication across multiple service instances
- Session affinity not required due to stateless design

## Environment Variables

```bash
# Server Configuration
PORT=3005
NODE_ENV=production

# Database
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Authentication
JWT_SECRET="your-256-bit-secret"

# Redis Configuration
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
REDIS_USE_TLS=true

# Kafka Configuration
KAFKA_CLIENT_ID=meeting-service
KAFKA_BROKER=kafka.example.com:9092
KAFKA_CONSUMER_GROUP_ID=meeting-service-group

# LiveKit Configuration
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-secret
LIVEKIT_WS_URL=wss://your-livekit-instance.livekit.cloud

# CORS
FRONTEND_URLS=https://app.example.com,https://admin.example.com
```

## Local Development Setup

**Prerequisites:**
- Node.js 18+ and npm 8+
- PostgreSQL 14+ running locally
- Redis 6+ running locally
- Kafka cluster (or Docker Compose setup)
- LiveKit Cloud account or self-hosted instance

**Installation:**
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

**Common Pitfalls:**
- Ensure PostgreSQL connection string includes SSL mode for cloud databases
- LiveKit WebSocket URL must be accessible from client browsers
- Redis connection requires proper TLS configuration in production
- Kafka topics must be created before first message publish

## Production Considerations

**Scaling:**
- Horizontal scaling supported via Redis adapter for Socket.IO
- Database connection pooling configured for high concurrency
- Stateless design enables load balancer distribution
- Consider read replicas for meeting history queries

**Load Balancing:**
- Sticky sessions NOT required due to Redis session storage
- Health check endpoint: `GET /health`
- Graceful shutdown handling for zero-downtime deployments

**Security Hardening:**
- Rate limiting configured per endpoint type
- Helmet.js security headers enabled
- CORS restricted to configured origins
- JWT secrets should be rotated regularly
- Database credentials stored in secure vault

**Monitoring & Logging:**
- Structured JSON logging for production parsing
- Kafka event publishing for audit trails
- Redis connection health monitoring
- LiveKit token generation metrics
- Socket.IO connection tracking

## Error Handling Strategy

**Centralized Error Handling:**
- Global Express error middleware catches unhandled exceptions
- Consistent error response format across all endpoints
- Database errors mapped to appropriate HTTP status codes

**Custom Error Codes:**
- `MEETING_NOT_FOUND` - 404 with meeting lookup failure
- `ACCESS_DENIED` - 403 for insufficient permissions
- `INVALID_CREDENTIALS` - 401 for authentication failures
- `MEETING_FULL` - 429 for capacity limits
- `INVALID_STATE` - 400 for lifecycle violations

**Client-Safe Error Responses:**
```typescript
{
  "success": false,
  "message": "Meeting not found",
  "errors": [
    {
      "field": "meetingId",
      "message": "Invalid meeting identifier"
    }
  ]
}
```

## Assumptions & Limitations

**Service Assumptions:**
- User authentication handled by upstream auth-service
- User profile data retrieved from user-management-service
- LiveKit infrastructure managed externally (cloud or self-hosted)
- Kafka cluster provides at-least-once delivery guarantees

**Current Limitations:**
- Maximum 3 co-hosts per meeting (configurable in code)
- Meeting recordings not implemented (requires LiveKit egress)
- No meeting scheduling notifications (requires notification-service)
- Participant limit enforced by LiveKit plan, not service logic

**Expected Upstream Behavior:**
- API Gateway provides request routing and initial authentication
- Auth-service maintains JWT blacklist and session state
- Frontend handles LiveKit WebRTC client integration

## Future Improvements

- **Meeting Analytics** - Participant engagement metrics and meeting duration tracking
- **Recording Integration** - LiveKit egress for meeting recordings and playback
- **Calendar Integration** - Sync with Google Calendar, Outlook for scheduling
- **Waiting Room** - Pre-meeting participant approval workflow
- **Breakout Rooms** - Sub-meeting creation for group discussions
- **Screen Sharing Controls** - Host-managed screen sharing permissions
- **Meeting Templates** - Reusable meeting configurations for recurring events
- **Advanced Security** - End-to-end encryption for sensitive meetings
- **Mobile SDK Support** - Native mobile app integration capabilities
- **Observability** - Distributed tracing with OpenTelemetry integration

## License & Ownership

**Internal Service** - Proprietary software for corporate use only.

**Contribution Guidelines:**
- All changes require code review and approval
- Database migrations must be backward compatible
- API changes require documentation updates
- Security changes require security team review