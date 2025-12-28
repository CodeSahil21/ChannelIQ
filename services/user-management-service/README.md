# User Management Service

## Service Overview

The User Management Service is a core microservice in the CorporateChat platform responsible for user profiles, social connections, preferences, and user lifecycle management. It provides comprehensive user data management including profile creation, connection requests, friend networks, and user preferences with real-time synchronization across the platform.

This service solves critical user experience challenges:
- Centralized user profile and preference management
- Social networking features with connection requests and friend systems
- Image upload and management for user avatars and group images
- Cross-service user data synchronization via event-driven architecture
- Advanced caching strategies for high-performance user data access

**Service Port:** 3003  
**API Gateway Endpoint:** `http://localhost:4000/api/user`

## Tech Stack

### Core Technologies

- **Node.js**: Runtime environment optimized for I/O-intensive operations and real-time features
- **TypeScript (Strict Mode)**: Compile-time type safety with strict configuration for enterprise-grade reliability
- **Express**: Lightweight web framework with comprehensive middleware ecosystem
- **Prisma**: Type-safe ORM with PostgreSQL integration, advanced indexing, and migration management
- **PostgreSQL**: Primary database with optimized indexes for user queries and connection lookups
- **Redis**: Multi-layer caching (user profiles, connections, preferences) with sub-millisecond access
- **Kafka**: Event streaming for cross-service user synchronization and real-time updates
- **Multer**: File upload handling for profile images with validation and processing

### Performance & Caching

- **Redis Caching**: Multi-tier caching strategy for user profiles, connections, and search results
- **Database Indexing**: Optimized indexes on email, username, and connection queries
- **Event-Driven Updates**: Real-time cache invalidation via Kafka events
- **Connection Pooling**: Prisma connection pooling for database efficiency

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│ User Management │────│   PostgreSQL    │
│   (Port 4000)   │    │   (Port 3003)   │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │      Redis      │    │      Kafka      │
                       │    (Cache)      │    │    (Events)     │
                       └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │  File Storage   │
                       │   (Uploads)     │
                       └─────────────────┘
```

### Request Flow

1. **Client** → API Gateway (with JWT authentication)
2. **API Gateway** → User Management Service
3. **Service** → Redis (cache lookup for user data)
4. **Service** → PostgreSQL (database operations if cache miss)
5. **Service** → Kafka (publish user events for cross-service sync)
6. **Service** → File System (image upload/retrieval)

## Data Models

### User Profile Model
```typescript
interface UserProfile {
  id: number;              // Auto-incrementing primary key
  userId: number;          // Foreign key to auth service user
  username: string;        // Unique username, indexed
  firstName: string;       // User's first name
  lastName: string;        // User's last name
  bio?: string;           // Optional user biography
  profileImage?: string;   // Profile image filename
  isProfileComplete: boolean; // Profile completion status
  createdAt: Date;        // Profile creation timestamp
  updatedAt: Date;        // Last modification timestamp
}
```

### Connection Model
```typescript
interface Connection {
  id: number;              // Auto-incrementing primary key
  senderId: number;        // User who sent the request
  receiverId: number;      // User who received the request
  status: ConnectionStatus; // PENDING, ACCEPTED, BLOCKED
  createdAt: Date;        // Connection request timestamp
  updatedAt: Date;        // Status change timestamp
}

enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED', 
  BLOCKED = 'BLOCKED'
}
```

### User Preferences Model
```typescript
interface UserPreferences {
  id: number;              // Auto-incrementing primary key
  userId: number;          // Foreign key to user profile
  theme: string;           // UI theme preference
  language: string;        // Language preference
  notifications: boolean;  // Notification settings
  privacy: string;         // Privacy level settings
  createdAt: Date;        // Preferences creation timestamp
  updatedAt: Date;        // Last modification timestamp
}
```

**Design Decision**: Numeric IDs provide optimal database performance for joins and foreign key relationships, while maintaining referential integrity across microservices.

## REST API Documentation

### Profile Management Endpoints

#### POST /api/v1/profile/create
**Purpose**: Create user profile after registration  
**Authentication**: Required (JWT cookie)

```typescript
interface CreateProfileRequest {
  username: string;        // 3-30 characters, alphanumeric + underscore
  firstName: string;       // 1-50 characters
  lastName: string;        // 1-50 characters
  bio?: string;           // Optional, max 500 characters
}

interface CreateProfileResponse {
  success: boolean;
  message: string;
  data: {
    profile: UserProfile;
  }
}
```

**Error Cases**: 400 (validation), 409 (username taken), 500 (server error)

#### GET /api/v1/profile/get-profile
**Purpose**: Retrieve authenticated user's profile  
**Authentication**: Required (JWT cookie)

```typescript
interface GetProfileResponse {
  success: boolean;
  message: string;
  data: {
    profile: UserProfile;
    preferences: UserPreferences;
  }
}
```

#### PUT /api/v1/profile/update
**Purpose**: Update user profile information  
**Authentication**: Required (JWT cookie)

```typescript
interface UpdateProfileRequest {
  username?: string;       // Optional username change
  firstName?: string;      // Optional first name update
  lastName?: string;       // Optional last name update
  bio?: string;           // Optional bio update
}

interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: {
    profile: UserProfile;
  }
}
```

#### POST /api/v1/profile/upload-image
**Purpose**: Upload profile image  
**Authentication**: Required (JWT cookie)  
**Content-Type**: multipart/form-data

```typescript
interface UploadImageRequest {
  image: File;             // Image file (JPEG, PNG, WebP)
}

interface UploadImageResponse {
  success: boolean;
  message: string;
  data: {
    imageUrl: string;      // Uploaded image URL
  }
}
```

**File Validation**: Max 5MB, supported formats: JPEG, PNG, WebP

#### DELETE /api/v1/profile/delete
**Purpose**: Delete user profile and all associated data  
**Authentication**: Required (JWT cookie)

```typescript
interface DeleteProfileResponse {
  success: boolean;
  message: string;
}
```

**Cascade Operations**: Removes all connections, preferences, and uploaded files

### Connection Management Endpoints

#### GET /api/v1/connections/get-connections
**Purpose**: Retrieve user's accepted connections  
**Authentication**: Required (JWT cookie)

```typescript
interface GetConnectionsResponse {
  success: boolean;
  message: string;
  data: {
    connections: Array<{
      id: number;
      user: UserProfile;
      connectedAt: Date;
    }>;
    totalCount: number;
  }
}
```

#### GET /api/v1/connections/pending-requests
**Purpose**: Retrieve pending connection requests  
**Authentication**: Required (JWT cookie)

```typescript
interface PendingRequestsResponse {
  success: boolean;
  message: string;
  data: {
    sent: Array<{
      id: number;
      receiver: UserProfile;
      sentAt: Date;
    }>;
    received: Array<{
      id: number;
      sender: UserProfile;
      sentAt: Date;
    }>;
  }
}
```

#### POST /api/v1/connections/send-request
**Purpose**: Send connection request to another user  
**Authentication**: Required (JWT cookie)

```typescript
interface SendRequestRequest {
  receiverId: number;      // Target user ID
}

interface SendRequestResponse {
  success: boolean;
  message: string;
  data: {
    connection: Connection;
  }
}
```

**Validation**: Prevents duplicate requests, self-requests, and requests to blocked users

#### PUT /api/v1/connections/respond-request
**Purpose**: Accept or reject connection request  
**Authentication**: Required (JWT cookie)

```typescript
interface RespondRequestRequest {
  connectionId: number;    // Connection request ID
  action: 'accept' | 'reject';
}

interface RespondRequestResponse {
  success: boolean;
  message: string;
  data: {
    connection?: Connection; // Present if accepted
  }
}
```

#### DELETE /api/v1/connections/remove-connection
**Purpose**: Remove existing connection  
**Authentication**: Required (JWT cookie)

```typescript
interface RemoveConnectionRequest {
  connectionId: number;    // Connection ID to remove
}

interface RemoveConnectionResponse {
  success: boolean;
  message: string;
}
```

#### POST /api/v1/connections/block-user
**Purpose**: Block another user  
**Authentication**: Required (JWT cookie)

```typescript
interface BlockUserRequest {
  userId: number;          // User ID to block
}

interface BlockUserResponse {
  success: boolean;
  message: string;
}
```

#### GET /api/v1/connections/search-users
**Purpose**: Search for users to connect with  
**Authentication**: Required (JWT cookie)

```typescript
interface SearchUsersQuery {
  query: string;           // Search term (username, name)
  limit?: number;          // Results limit (default: 20)
  offset?: number;         // Pagination offset
}

interface SearchUsersResponse {
  success: boolean;
  message: string;
  data: {
    users: Array<{
      id: number;
      username: string;
      firstName: string;
      lastName: string;
      profileImage?: string;
      connectionStatus?: ConnectionStatus;
    }>;
    totalCount: number;
  }
}
```

### Preferences Management Endpoints

#### GET /api/v1/preferences/get-preferences
**Purpose**: Retrieve user preferences  
**Authentication**: Required (JWT cookie)

```typescript
interface GetPreferencesResponse {
  success: boolean;
  message: string;
  data: {
    preferences: UserPreferences;
  }
}
```

#### PUT /api/v1/preferences/update-preferences
**Purpose**: Update user preferences  
**Authentication**: Required (JWT cookie)

```typescript
interface UpdatePreferencesRequest {
  theme?: 'light' | 'dark' | 'system';
  language?: string;       // ISO language code
  notifications?: boolean;
  privacy?: 'public' | 'friends' | 'private';
}

interface UpdatePreferencesResponse {
  success: boolean;
  message: string;
  data: {
    preferences: UserPreferences;
  }
}
```

## Caching Architecture

### Redis Caching Strategy

#### Cache Keys Structure
- User profiles: `user:profile:{userId}`
- User connections: `user:connections:{userId}`
- User preferences: `user:preferences:{userId}`
- Search results: `search:users:{query}:{offset}`
- Connection counts: `user:stats:{userId}`

#### Cache TTL Configuration
- **User Profiles**: 1 hour (frequently accessed, moderate update frequency)
- **Connections**: 30 minutes (social data, moderate volatility)
- **Preferences**: 2 hours (rarely changed, high read frequency)
- **Search Results**: 15 minutes (dynamic content, acceptable staleness)

#### Cache Invalidation Strategy
- **Profile Updates**: Immediate invalidation on profile changes
- **Connection Changes**: Invalidate both users' connection caches
- **Cross-Service Events**: Kafka-driven cache invalidation
- **Batch Operations**: Bulk cache invalidation for efficiency

### Performance Optimization
- **Cache Warming**: Pre-populate frequently accessed user data
- **Cache Aside Pattern**: Application manages cache population and invalidation
- **Compression**: JSON compression for large cached objects
- **Pipeline Operations**: Batch Redis operations for efficiency

## Event-Driven Architecture

### Kafka Integration

#### Published Events
```typescript
interface UserProfileCreatedEvent {
  eventType: 'USER_PROFILE_CREATED';
  userId: number;
  profileId: number;
  username: string;
  timestamp: Date;
}

interface UserProfileUpdatedEvent {
  eventType: 'USER_PROFILE_UPDATED';
  userId: number;
  profileId: number;
  changes: Partial<UserProfile>;
  timestamp: Date;
}

interface ConnectionEstablishedEvent {
  eventType: 'CONNECTION_ESTABLISHED';
  connectionId: number;
  userId1: number;
  userId2: number;
  timestamp: Date;
}

interface UserPreferencesUpdatedEvent {
  eventType: 'USER_PREFERENCES_UPDATED';
  userId: number;
  preferences: UserPreferences;
  timestamp: Date;
}
```

#### Consumed Events
```typescript
interface UserRegisteredEvent {
  eventType: 'USER_REGISTERED';
  userId: number;
  email: string;
  timestamp: Date;
}

interface UserDeletedEvent {
  eventType: 'USER_DELETED';
  userId: number;
  timestamp: Date;
}
```

### Event Processing
- **Profile Creation**: Triggered by USER_REGISTERED events from auth-service
- **Cross-Service Sync**: Real-time user data synchronization
- **Cache Invalidation**: Event-driven cache management
- **Analytics**: User behavior tracking for insights

### Topic Configuration
- **user-management-events**: User profile and connection events (8 partitions)
- **user-events**: Cross-service user lifecycle events (6 partitions)

## Security Model

### Authentication & Authorization
- **JWT Validation**: Middleware validates JWT tokens from HTTP-only cookies
- **User Context**: Extracted user ID from JWT for all operations
- **Resource Ownership**: Users can only access/modify their own data
- **Connection Privacy**: Users can only view connections of connected users

### File Upload Security
- **File Type Validation**: Whitelist of allowed image formats
- **File Size Limits**: Maximum 5MB per upload
- **Path Sanitization**: Prevents directory traversal attacks
- **Virus Scanning**: Consider integration for production environments

### Data Privacy
- **Profile Visibility**: Configurable privacy settings
- **Connection Hiding**: Option to hide connection lists
- **Data Anonymization**: Soft delete with data anonymization
- **GDPR Compliance**: Complete data deletion capabilities

## Error Handling Strategy

### HTTP Status Codes
- **400**: Validation errors with detailed field messages
- **401**: Authentication failures
- **403**: Authorization failures (accessing other users' data)
- **404**: Resource not found (user, connection, etc.)
- **409**: Conflict errors (username taken, duplicate requests)
- **413**: File too large
- **415**: Unsupported media type
- **429**: Rate limiting (if implemented)
- **500**: Internal server errors

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

### Failure Recovery
- **Database Failures**: Graceful degradation with cached data
- **Redis Failures**: Continue operation without caching
- **Kafka Failures**: Queue events for retry
- **File System Failures**: Fallback to default images

## Environment Variables

```env
# Server Configuration
PORT=3003
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/corporatechat

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_USE_TLS=false

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=user-management-service
KAFKA_CONSUMER_GROUP_ID=user-management-group

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Cache Configuration
CACHE_TTL_PROFILE=3600
CACHE_TTL_CONNECTIONS=1800
CACHE_TTL_PREFERENCES=7200
CACHE_TTL_SEARCH=900

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
cd services/user-management-service
npm install
```

2. **Database Setup**
```bash
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

4. **File Storage Setup**
```bash
# Create uploads directory
mkdir -p uploads/profiles
mkdir -p uploads/groups
```

5. **Kafka Setup**
```bash
# Start Kafka
bin/kafka-server-start.sh config/server.properties

# Create topics (auto-created on startup)
```

6. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

7. **Start Service**
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

8. **Health Check**
```bash
curl http://localhost:3003/health
```

## Production Considerations

### Horizontal Scaling
- **Stateless Design**: All user state in database/cache enables scaling
- **Load Balancing**: Round-robin or least-connections algorithms
- **Database Sharding**: User-based sharding for massive scale
- **Cache Clustering**: Redis Cluster for high availability

### File Storage Strategy
- **Production**: Migrate to AWS S3 or similar cloud storage
- **CDN Integration**: CloudFront for global image delivery
- **Image Processing**: Resize and optimize images on upload
- **Backup Strategy**: Regular backup of user-uploaded content

### Performance Optimization
- **Database Indexing**: Optimized indexes on frequently queried fields
- **Connection Pooling**: Prisma connection pooling configuration
- **Query Optimization**: Efficient queries with proper joins
- **Caching Strategy**: Multi-layer caching with intelligent invalidation

### Monitoring & Observability
- **Health Checks**: Database, Redis, and Kafka connectivity
- **Metrics**: User registration rates, connection activity, cache hit rates
- **Logging**: Structured logging with correlation IDs
- **Alerting**: Critical error and performance threshold alerts

## Common Pitfalls & Design Decisions

### Why Separate User Management from Auth?
- **Separation of Concerns**: Authentication vs user data management
- **Scalability**: Independent scaling based on different usage patterns
- **Security**: Isolate sensitive auth operations from user data
- **Flexibility**: Different caching and optimization strategies

### Why Redis for Caching vs Database?
- **Performance**: Sub-millisecond access vs database query latency
- **Scalability**: Reduces database load for frequently accessed data
- **Flexibility**: TTL-based expiration and complex data structures
- **Cost**: Reduces expensive database operations

### Why File System vs Cloud Storage?
- **Development**: Simplified local development setup
- **Cost**: No cloud storage costs during development
- **Migration Path**: Easy migration to cloud storage in production
- **Control**: Full control over file handling and processing

### Connection Model Design
- **Bidirectional**: Single record represents mutual connection
- **Status Tracking**: Clear state machine for connection lifecycle
- **Scalability**: Efficient queries for connection lists and counts
- **Privacy**: Granular control over connection visibility

## Future Improvements

### Short-term Enhancements
- **Advanced Search**: Full-text search with Elasticsearch integration
- **User Verification**: Verified user badges and verification process
- **Activity Feed**: User activity tracking and timeline
- **Recommendation Engine**: Friend suggestions based on mutual connections

### Long-term Considerations
- **Microservice Split**: Separate connection service for social features
- **Real-time Features**: WebSocket integration for live user status
- **Analytics Service**: User behavior analytics and insights
- **Machine Learning**: Intelligent friend recommendations and content personalization

### Scalability Improvements
- **Database Sharding**: Horizontal database scaling by user ID
- **Event Sourcing**: Complete audit trail of user actions
- **CQRS Pattern**: Separate read/write models for optimization
- **GraphQL API**: Flexible data fetching for mobile applications