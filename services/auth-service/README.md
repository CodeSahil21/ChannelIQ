# Authentication Service

## Service Overview

The Authentication Service is a core microservice in the CorporateChat platform responsible for user registration, authentication, session management, and password recovery. It provides secure JWT-based authentication with Redis session storage and comprehensive security features including rate limiting and OTP verification.

This service solves critical security challenges:
- Centralized user authentication across microservices
- Secure session management with Redis-backed storage
- Password recovery with time-limited OTP verification
- Rate limiting to prevent brute force attacks
- Event-driven architecture for user lifecycle management

**Service Port:** 3001  
**API Gateway Endpoint:** `http://localhost:4000/api/auth`

## Tech Stack

### Core Technologies

- **Node.js**: Runtime environment chosen for its event-driven architecture and excellent performance for I/O operations
- **TypeScript (Strict Mode)**: Provides compile-time type safety and enhanced developer experience with strict configuration
- **Express**: Lightweight web framework for REST API endpoints with middleware support
- **Prisma**: Type-safe database ORM with PostgreSQL integration and migration management
- **PostgreSQL**: Primary database for persistent user data storage
- **Redis**: Session storage, caching, and rate limiting with sub-millisecond access times
- **JWT + HTTP-Only Cookies**: Secure authentication tokens stored in HTTP-only cookies to prevent XSS attacks
- **bcrypt**: Password hashing with configurable salt rounds for security
- **Kafka**: Event streaming for microservice communication and user lifecycle events

### Security & Middleware

- **Helmet**: Security headers and protection against common vulnerabilities
- **CORS**: Cross-origin resource sharing with configurable origins
- **Rate Limiting**: Custom Redis-based rate limiting for login and registration endpoints
- **Input Validation**: Zod schema validation for all request payloads
- **Compression**: Response compression for improved performance

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Auth Service   │────│   PostgreSQL    │
│   (Port 4000)   │    │   (Port 3001)   │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │      Redis      │    │      Kafka      │
                       │   (Sessions)    │    │    (Events)     │
                       └─────────────────┘    └─────────────────┘
```

### Request Flow

1. **Client** → API Gateway (authentication required endpoints)
2. **API Gateway** → Auth Service (JWT validation via cookies)
3. **Auth Service** → Redis (session validation)
4. **Auth Service** → PostgreSQL (user data operations)
5. **Auth Service** → Kafka (user lifecycle events)

## Data Models

### User Model
```typescript
interface User {
  id: number;           // Auto-incrementing primary key
  email: string;        // Unique identifier, normalized to lowercase
  password: string;     // bcrypt hashed with salt rounds
  createdAt: Date;      // Account creation timestamp
  updatedAt: Date;      // Last modification timestamp
}
```

### Session Model (Redis)
```typescript
interface Session {
  id: number;           // User ID
  email: string;        // User email for quick access
  jti: string;          // JWT ID for token tracking
}
```

### OTP Model (Redis)
```typescript
interface OTPData {
  otp: string;          // 6-digit numeric code
  expiresAt: string;    // ISO timestamp for expiration
}
```

**Design Decision**: Numeric IDs are used for users as they provide better database performance for joins and indexing compared to UUIDs, while JTI uses UUIDs for cryptographic security.

## REST API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/register
**Purpose**: Register a new user account  
**Authentication**: None required  
**Rate Limit**: 3 attempts per hour per IP

```typescript
interface RegisterRequest {
  email: string;     // Valid email format, auto-normalized
  password: string;  // Minimum 6 characters
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
    }
  }
}
```

**Error Cases**: 400 (validation), 409 (email exists), 429 (rate limited), 500 (server error)

#### POST /api/v1/auth/login
**Purpose**: Authenticate user and create session  
**Authentication**: None required  
**Rate Limit**: 10 attempts per 15 minutes per IP

```typescript
interface LoginRequest {
  email: string;     // Valid email format
  password: string;  // Minimum 6 characters
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
    }
  }
}
```

**Security Features**: Failed login tracking (5 attempts = 15-minute lockout), timing attack protection

#### GET /api/v1/auth/get-profile
**Purpose**: Retrieve authenticated user profile  
**Authentication**: Required (JWT cookie)

```typescript
interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
    }
  }
}
```

#### POST /api/v1/auth/logout
**Purpose**: Logout user and invalidate session  
**Authentication**: Required (JWT cookie)

```typescript
interface LogoutResponse {
  success: boolean;
  message: string;
}
```

**Security Actions**: Clears HTTP-only cookie, removes Redis session, blacklists token

### Password Recovery Endpoints

#### POST /api/v1/auth/forgot-password
**Purpose**: Request password reset OTP  
**Authentication**: None required

```typescript
interface ForgotPasswordRequest {
  email: string;  // Valid email format
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}
```

**Security**: Returns success even if email doesn't exist (prevents enumeration)

#### POST /api/v1/auth/verify-otp
**Purpose**: Verify OTP for password reset  
**Authentication**: None required

```typescript
interface VerifyOTPRequest {
  email: string;  // Valid email format
  otp: string;    // Exactly 6 digits
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
}
```

#### POST /api/v1/auth/reset-password
**Purpose**: Reset password using verified OTP  
**Authentication**: None required

```typescript
interface ResetPasswordRequest {
  email: string;      // Valid email format
  otp: string;        // Exactly 6 digits
  newPassword: string; // Minimum 8 characters
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}
```

## Session Management Architecture

### JWT Token Structure
```typescript
interface JWTPayload {
  id: number;       // User ID
  jti: string;      // JWT ID (UUID v4)
  iat: number;      // Issued at timestamp
  exp: number;      // Expiration timestamp (7 days)
}
```

### Session Flow
1. **Login** → Generate JWT with unique JTI → Store session in Redis → Set HTTP-only cookie
2. **Request** → Extract JWT from cookie → Verify signature → Check blacklist → Validate session
3. **Logout** → Remove Redis session → Blacklist JTI → Clear cookie

### Redis Session Keys
- Sessions: `auth:session:{jti}`
- Blacklist: `auth:blacklist:{jti}`
- OTP: `auth:otp:{email}`
- Failed attempts: `auth:failed:{email}`
- Rate limiting: `ratelimit:{type}:{ip}`

## Security Model

### Cookie-Based Authentication
- **HTTP-Only**: Prevents XSS access to tokens
- **Secure**: HTTPS-only in production
- **SameSite**: 'strict' in development, 'none' in production for cross-origin
- **Path**: '/' for global access

### CSRF Protection
HTTP-only cookies with SameSite attributes provide CSRF protection without requiring additional tokens.

### Authorization Model
- **Session Validation**: Every protected route validates Redis session existence
- **Token Blacklisting**: Immediate revocation capability with 5-minute blacklist window
- **Rate Limiting**: IP-based rate limiting with exponential backoff

### Password Security
- **bcrypt**: 10 salt rounds for password hashing
- **Timing Attack Protection**: Consistent response times regardless of user existence
- **Minimum Requirements**: 6 characters for login, 8 for password reset

## Error Handling Strategy

### HTTP Status Codes
- **400**: Validation errors with field-specific messages
- **401**: Authentication failures (invalid/expired tokens)
- **409**: Resource conflicts (email already exists)
- **429**: Rate limiting violations
- **500**: Internal server errors (sanitized messages)
- **503**: Service unavailable (database/Redis failures)

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### Failure Scenarios
- **Database Failures**: Graceful degradation with 503 responses
- **Redis Failures**: Continue operation without sessions (fallback to stateless)
- **Kafka Failures**: Log errors but don't block user operations
- **Email Failures**: Return success to prevent enumeration attacks

## Event-Driven Architecture

### Kafka Integration
The service publishes user lifecycle events to enable microservice coordination:

```typescript
// Published Events
interface UserRegisteredEvent {
  eventType: 'USER_REGISTERED';
  userId: number;
  email: string;
  timestamp: Date;
}

interface UserLoggedInEvent {
  eventType: 'USER_LOGGED_IN';
  userId: number;
  email: string;
  timestamp: Date;
}

interface UserLoggedOutEvent {
  eventType: 'USER_LOGGED_OUT';
  userId: number;
  email: string;
  timestamp: Date;
}
```

### Consumer Events
- **USER_DELETED**: Removes user from auth database when deleted from user-management service

### Kafka Configuration (Aiven Free Tier Compatible)
- **Topics Used**: `user-events` (2 partitions)
- **Publisher**: Publishes USER_REGISTERED, USER_LOGGED_IN, USER_LOGGED_OUT events
- **Consumer**: Subscribes to `user-events` for USER_DELETED events
- **Total Topics**: 3/5 (user-events, chat-events, media-events)
- **Total Partitions**: 6/10 across all topics

## Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/corporatechat

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_USE_TLS=false

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=auth-service
KAFKA_CONSUMER_GROUP_ID=auth-service-group

# CORS Configuration
FRONTEND_URLS=http://localhost:3000,http://localhost:5173
```

## Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Kafka 2.8+

### Setup Steps

1. **Install Dependencies**
```bash
cd services/auth-service
npm install
```

2. **Database Setup**
```bash
# Create database
createdb corporatechat

# Set DATABASE_URL in .env
echo "DATABASE_URL=postgresql://username:password@localhost:5432/corporatechat" >> .env

# Run migrations
npx prisma migrate dev
npx prisma generate
```

3. **Redis Setup**
```bash
# Start Redis server
redis-server

# Verify connection
redis-cli ping
```

4. **Kafka Setup**
```bash
# Start Kafka (with Zookeeper)
bin/kafka-server-start.sh config/server.properties

# Topics are auto-created on service startup
```

5. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

6. **Start Service**
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

7. **Health Check**
```bash
curl http://localhost:3001/health
```

## Production Considerations

### Horizontal Scaling
- **Stateless Design**: All session data in Redis enables horizontal scaling
- **Load Balancer**: No sticky sessions required due to Redis session storage
- **Database Connections**: Use connection pooling (Prisma handles this)

### Docker Deployment
```dockerfile
# Multi-stage build for optimized production image
FROM node:20-alpine AS builder
# ... build steps

FROM node:20-alpine
# ... production setup with non-root user
```

### Monitoring & Observability
- **Health Endpoint**: `/health` checks database and Kafka connectivity
- **Structured Logging**: Winston logger with JSON format
- **Metrics**: Consider adding Prometheus metrics for production

### Security Hardening
- **Rate Limiting**: Implement at load balancer level for additional protection
- **Secrets Management**: Use AWS Secrets Manager or similar in production
- **TLS**: Enable Redis TLS in production environments
- **CORS**: Restrict origins to known frontend domains

### Performance Optimization
- **Redis Clustering**: For high availability and performance
- **Database Indexing**: Email field is indexed for fast lookups
- **Connection Pooling**: Prisma connection pooling configured
- **Compression**: Gzip compression enabled for responses

## Common Pitfalls & Design Decisions

### Why HTTP-Only Cookies vs localStorage?
- **Security**: Prevents XSS attacks from accessing tokens
- **Automatic Handling**: Browsers handle cookie transmission automatically
- **CSRF Protection**: SameSite attributes provide built-in protection

### Why Redis for Sessions?
- **Performance**: Sub-millisecond access times vs database queries
- **Scalability**: Enables stateless application servers
- **TTL Support**: Automatic session expiration without cleanup jobs

### Why bcrypt vs Other Hashing?
- **Industry Standard**: Well-tested and widely adopted
- **Adaptive**: Configurable work factor for future-proofing
- **Salt Integration**: Built-in salt generation and verification

### Why Kafka vs Direct HTTP?
- **Decoupling**: Services don't need to know about each other
- **Reliability**: Message persistence and replay capabilities
- **Scalability**: Handles high-throughput event streams

## Future Improvements

### Short-term Enhancements
- **Multi-factor Authentication**: TOTP support for enhanced security
- **OAuth Integration**: Google/Microsoft SSO for enterprise users
- **Audit Logging**: Comprehensive authentication event logging
- **Password Policies**: Configurable complexity requirements

### Long-term Considerations
- **Microservice Split**: Separate OTP service for reusability
- **Event Sourcing**: Full audit trail of authentication events
- **Distributed Tracing**: OpenTelemetry integration for request tracing
- **Advanced Rate Limiting**: Sliding window and distributed rate limiting

### Scalability Improvements
- **Redis Clustering**: High availability and horizontal scaling
- **Database Sharding**: User-based sharding for massive scale
- **CDN Integration**: Static asset delivery optimization
- **Caching Layer**: Application-level caching for frequently accessed data