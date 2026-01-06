# Media Service

## Service Overview

The Media Service is a specialized microservice in the CorporateChat platform responsible for file upload, storage, processing, and delivery of media content. It handles profile images, group images, chat attachments, and provides secure file access with Supabase Storage integration and optimized delivery mechanisms.

This service solves critical media management challenges:
- Centralized file upload and storage across all platform features
- Secure file access with Supabase public URLs and access control
- File type validation and security scanning
- Optimized file delivery with compression and caching
- Cross-service media synchronization via event-driven architecture
- Scalable cloud storage architecture with Supabase Storage

**Service Port:** 3003  
**API Gateway Endpoint:** `http://localhost:4000/api/media`

## Tech Stack

### Core Technologies

- **Node.js**: Runtime environment optimized for I/O operations and file streaming
- **TypeScript (Strict Mode)**: Type-safe development with strict configuration for file handling
- **Express**: Web framework with comprehensive middleware for file operations
- **Multer**: Advanced file upload middleware with validation and processing
- **Supabase Storage**: Cloud storage backend for scalable file management
- **Redis**: File metadata caching and temporary storage for processing queues
- **Kafka**: Event streaming for media lifecycle events and cross-service notifications
- **Sharp** (Future): Image processing and optimization library

### Security & Validation

- **File Type Validation**: MIME type checking and magic number verification
- **File Size Limits**: Configurable limits per file type and user role
- **Path Sanitization**: Prevention of directory traversal attacks
- **Access Control**: JWT-based authentication for file operations
- **Virus Scanning**: Integration ready for production security

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Media Service  │────│ Supabase Storage│
│   (Port 4000)   │    │   (Port 3003)   │    │   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │      Redis      │    │      Kafka      │
                       │   (Metadata)    │    │    (Events)     │
                       └─────────────────┘    └─────────────────┘
```

### Request Flow

1. **Client** → API Gateway (with JWT authentication)
2. **API Gateway** → Media Service (file upload/download requests)
3. **Media Service** → File Validation (type, size, security checks)
4. **Media Service** → Supabase Storage (cloud file storage)
5. **Media Service** → Redis (metadata caching)
6. **Media Service** → Kafka (media lifecycle events)

## Data Models

### File Metadata Model
```typescript
interface FileMetadata {
  id: string;              // UUID for file identification
  originalName: string;    // Original filename from upload
  filename: string;        // Stored filename (UUID-based)
  mimetype: string;        // MIME type of the file
  size: number;           // File size in bytes
  path: string;           // Storage path
  uploadedBy: number;     // User ID who uploaded
  uploadedAt: Date;       // Upload timestamp
  category: FileCategory; // File category classification
  isPublic: boolean;      // Public access flag
  metadata?: object;      // Additional file metadata (dimensions, etc.)
}

enum FileCategory {
  PROFILE_IMAGE = 'profile_image',
  GROUP_IMAGE = 'group_image',
  CHAT_ATTACHMENT = 'chat_attachment',
  DOCUMENT = 'document',
  MEDIA = 'media'
}
```

### Presigned URL Model
```typescript
interface PresignedURL {
  url: string;            // Presigned access URL
  expiresAt: Date;        // URL expiration timestamp
  fileId: string;         // Associated file ID
  accessType: 'read' | 'write'; // Access permission type
}
```

### Upload Configuration
```typescript
interface UploadConfig {
  maxFileSize: number;    // Maximum file size in bytes
  allowedTypes: string[]; // Allowed MIME types
  category: FileCategory; // File category
  isPublic: boolean;      // Public access setting
}
```

**Design Decision**: UUID-based file IDs prevent enumeration attacks and provide globally unique identifiers across distributed storage systems.

## REST API Documentation

### File Upload Endpoints

#### POST /api/v1/media/upload
**Purpose**: Upload single file with metadata  
**Authentication**: Required (JWT cookie)  
**Content-Type**: multipart/form-data

```typescript
interface UploadRequest {
  file: File;             // File to upload
  category: FileCategory; // File category
  isPublic?: boolean;     // Public access (default: false)
}

interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    file: {
      id: string;
      filename: string;
      originalName: string;
      size: number;
      mimetype: string;
      url: string;        // Access URL
      category: FileCategory;
    }
  }
}
```

**File Validation**:
- **Images**: JPEG, PNG, WebP, GIF (max 50MB)
- **Videos**: MP4, WebM (max 50MB)
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (max 50MB)

#### POST /api/v1/media/upload-multiple
**Purpose**: Upload multiple files in batch  
**Authentication**: Required (JWT cookie)  
**Content-Type**: multipart/form-data

```typescript
interface MultipleUploadRequest {
  files: File[];          // Array of files
  category: FileCategory; // Category for all files
  isPublic?: boolean;     // Public access setting
}

interface MultipleUploadResponse {
  success: boolean;
  message: string;
  data: {
    files: Array<{
      id: string;
      filename: string;
      originalName: string;
      size: number;
      url: string;
    }>;
    failed: Array<{
      filename: string;
      error: string;
    }>;
  }
}
```

### File Access Endpoints

#### GET /api/v1/media/file/:fileId
**Purpose**: Download file by ID  
**Authentication**: Required (JWT cookie)

```typescript
interface FileDownloadResponse {
  // Returns file stream with appropriate headers
  'Content-Type': string;
  'Content-Length': string;
  'Content-Disposition': string;
  'Cache-Control': string;
}
```

**Security**: Validates user access permissions before serving file

#### GET /api/v1/media/presigned-url/:fileId
**Purpose**: Generate presigned URL for file access  
**Authentication**: Required (JWT cookie)

```typescript
interface PresignedURLResponse {
  success: boolean;
  message: string;
  data: {
    url: string;          // Presigned URL
    expiresAt: Date;      // URL expiration
    expiresIn: number;    // Seconds until expiration
  }
}
```

**URL Expiration**: 1 hour for private files, 24 hours for public files

#### GET /api/v1/media/metadata/:fileId
**Purpose**: Retrieve file metadata  
**Authentication**: Required (JWT cookie)

```typescript
interface FileMetadataResponse {
  success: boolean;
  message: string;
  data: {
    file: FileMetadata;
  }
}
```

### File Management Endpoints

#### DELETE /api/v1/media/file/:fileId
**Purpose**: Delete file and metadata  
**Authentication**: Required (JWT cookie)

```typescript
interface DeleteFileResponse {
  success: boolean;
  message: string;
}
```

**Security**: Only file owner or admin can delete files

#### GET /api/v1/media/user-files
**Purpose**: List user's uploaded files  
**Authentication**: Required (JWT cookie)

```typescript
interface UserFilesQuery {
  category?: FileCategory; // Filter by category
  limit?: number;         // Results limit (default: 50)
  offset?: number;        // Pagination offset
  sortBy?: 'date' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
}

interface UserFilesResponse {
  success: boolean;
  message: string;
  data: {
    files: FileMetadata[];
    totalCount: number;
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    }
  }
}
```

#### PUT /api/v1/media/update-metadata/:fileId
**Purpose**: Update file metadata  
**Authentication**: Required (JWT cookie)

```typescript
interface UpdateMetadataRequest {
  isPublic?: boolean;     // Change public access
  category?: FileCategory; // Update category
}

interface UpdateMetadataResponse {
  success: boolean;
  message: string;
  data: {
    file: FileMetadata;
  }
}
```

### Health & Statistics Endpoints

#### GET /api/v1/media/health
**Purpose**: Service health check  
**Authentication**: None required

```typescript
interface HealthResponse {
  success: boolean;
  message: string;
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    storage: {
      available: boolean;
      freeSpace: string;
    };
    redis: {
      connected: boolean;
      latency: number;
    };
    kafka: {
      connected: boolean;
    }
  }
}
```

#### GET /api/v1/media/stats
**Purpose**: Storage and usage statistics  
**Authentication**: Required (Admin only)

```typescript
interface StatsResponse {
  success: boolean;
  message: string;
  data: {
    totalFiles: number;
    totalSize: string;
    byCategory: Record<FileCategory, {
      count: number;
      size: string;
    }>;
    recentUploads: number; // Last 24 hours
  }
}
```

## File Storage Architecture

### Storage Strategy

#### Local File System (Development)
```
uploads/
├── profiles/           # Profile images
├── groups/            # Group images  
├── attachments/       # Chat attachments
├── documents/         # Document files
└── temp/             # Temporary processing files
```

#### Cloud Storage (Production)
- **AWS S3**: Primary storage with versioning and lifecycle policies
- **CloudFront CDN**: Global content delivery network
- **Backup Strategy**: Cross-region replication for disaster recovery

### File Organization
- **Directory Structure**: Organized by category and date (YYYY/MM/DD)
- **Filename Strategy**: UUID-based names to prevent conflicts and enumeration
- **Metadata Storage**: Redis for fast access, database for persistence
- **Cleanup Jobs**: Automated removal of orphaned and expired files

### Security Measures
- **Access Control**: JWT-based authentication for all operations
- **File Validation**: MIME type and magic number verification
- **Size Limits**: Configurable per file type and user role
- **Virus Scanning**: ClamAV integration for production environments
- **Path Sanitization**: Prevention of directory traversal attacks

## Caching Architecture

### Redis Caching Strategy

#### Cache Keys Structure
- File metadata: `media:file:{fileId}`
- User files: `media:user:{userId}:files`
- Presigned URLs: `media:presigned:{fileId}:{userId}`
- Upload quotas: `media:quota:{userId}:{period}`
- File statistics: `media:stats:global`

#### Cache TTL Configuration
- **File Metadata**: 2 hours (moderate update frequency)
- **User File Lists**: 30 minutes (dynamic content)
- **Presigned URLs**: Match URL expiration time
- **Upload Quotas**: 1 hour (rate limiting data)
- **Statistics**: 15 minutes (acceptable staleness for admin data)

#### Cache Invalidation
- **File Upload**: Invalidate user file lists and statistics
- **File Deletion**: Remove all related cache entries
- **Metadata Updates**: Invalidate specific file metadata
- **Batch Operations**: Bulk cache invalidation for efficiency

## Event-Driven Architecture

### Kafka Integration (Aiven Free Tier Compatible)

#### Published Events
```typescript
interface ProfileImageUploadedEvent {
  eventType: 'PROFILE_IMAGE_UPLOADED';
  userId: string;
  imageUrl: string;
  timestamp: string;
  metadata?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
  }
}

interface ProfileImageDeletedEvent {
  eventType: 'PROFILE_IMAGE_DELETED';
  userId: string;
  timestamp: string;
  metadata?: {
    fileName: string;
  }
}

interface GroupProfileImageUploadedEvent {
  eventType: 'GROUP_PROFILE_IMAGE_UPLOADED';
  userId: string;
  imageUrl: string;
  timestamp: string;
  metadata?: {
    groupId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }
}

interface MessageFileUploadedEvent {
  eventType: 'MESSAGE_FILE_UPLOADED';
  userId: string;
  imageUrl: string;
  timestamp: string;
  metadata?: {
    groupId: string;
    messageType: 'IMAGE' | 'VIDEO' | 'FILE';
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }
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

### Kafka Configuration
- **Topics Used**: 
  - `media-events` (2 partitions): Media lifecycle events
  - `user-events` (2 partitions): User cleanup events
- **Publisher**: Publishes all media events to media-events topic
- **Consumer**: Subscribes to user-events for cleanup operations
- **Total Topics**: 3/5 (user-events, chat-events, media-events)
- **Total Partitions**: 6/10 across all topics

### Event Processing
- **File Lifecycle**: Track file operations for analytics and auditing
- **Cross-Service Sync**: Notify other services of media changes
- **Cleanup Operations**: Remove files when users are deleted
- **Real-time Updates**: Immediate notification of media changes

## Security Model

### Authentication & Authorization
- **JWT Validation**: Middleware validates tokens from HTTP-only cookies
- **File Ownership**: Users can only access files they uploaded or have permission to view
- **Admin Access**: Administrators can access all files for moderation
- **Public Files**: Configurable public access for shared content

### File Security
- **MIME Type Validation**: Whitelist of allowed file types
- **Magic Number Verification**: Prevents MIME type spoofing
- **File Size Limits**: Prevents DoS attacks via large uploads
- **Virus Scanning**: Real-time scanning for malicious content
- **Content Filtering**: Optional content moderation for images

### Access Control
- **Presigned URLs**: Time-limited access without exposing storage details
- **Rate Limiting**: Upload frequency and size quotas per user
- **IP Restrictions**: Optional IP-based access control for sensitive files
- **Audit Logging**: Complete access logs for security monitoring

## Error Handling Strategy

### HTTP Status Codes
- **400**: Validation errors (invalid file type, size exceeded)
- **401**: Authentication failures
- **403**: Authorization failures (access denied to file)
- **404**: File not found
- **413**: Payload too large
- **415**: Unsupported media type
- **422**: Unprocessable entity (corrupted file)
- **429**: Rate limit exceeded
- **507**: Insufficient storage space
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
  code?: string; // Error code for client handling
}
```

### Failure Recovery
- **Storage Failures**: Retry with exponential backoff
- **Processing Failures**: Queue for manual review
- **Network Failures**: Resume interrupted uploads
- **Corruption Detection**: Automatic file integrity verification

## Environment Variables

```env
# Server Configuration
PORT=3003
JWT_SECRET=your_jwt_secret

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET_NAME=chapters

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_USE_TLS=false

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=media-service
KAFKA_CONSUMER_GROUP_ID=media-service-group

# File Validation
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain

# Rate Limiting
UPLOAD_RATE_LIMIT=10
UPLOAD_RATE_WINDOW=900
USER_STORAGE_QUOTA=1073741824

# CORS Configuration
FRONTEND_URLS=http://localhost:3000,http://localhost:5173
```

## Local Development Setup

### Prerequisites
- Node.js 20+
- Redis 6+
- Kafka 2.8+
- Supabase Account with Storage enabled

### Setup Steps

1. **Install Dependencies**
```bash
cd services/media-service
npm install
```

2. **Supabase Setup**
```bash
# Create Supabase project at https://supabase.com
# Enable Storage in your Supabase dashboard
# Create a bucket named 'chapters' (or update SUPABASE_BUCKET_NAME)
# Set bucket to public access
# Copy your project URL and service role key to .env
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
# Start Kafka
bin/kafka-server-start.sh config/server.properties

# Topics are auto-created on service startup
```

5. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
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
curl http://localhost:3003/api/v1/media/health
```

8. **Test File Upload**
```bash
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "profileImage=@test-image.jpg" \
  http://localhost:4000/api/media/upload-profile-image
```

## Production Considerations

### Cloud Storage Migration
- **AWS S3 Integration**: Seamless migration from local to cloud storage
- **CDN Configuration**: CloudFront for global content delivery
- **Backup Strategy**: Cross-region replication and versioning
- **Cost Optimization**: Intelligent tiering and lifecycle policies

### Performance Optimization
- **Image Processing**: Automatic resizing and format optimization
- **Compression**: On-the-fly compression for large files
- **Caching**: Aggressive caching with proper cache headers
- **Streaming**: Efficient file streaming for large media files

### Security Hardening
- **Virus Scanning**: Real-time malware detection
- **Content Moderation**: AI-powered content filtering
- **Access Logging**: Comprehensive audit trails
- **Encryption**: At-rest and in-transit encryption

### Monitoring & Observability
- **Storage Metrics**: Usage, growth, and performance monitoring
- **Error Tracking**: File operation failures and retry patterns
- **Performance Monitoring**: Upload/download speeds and latency
- **Cost Tracking**: Storage and bandwidth cost analysis

### Scalability Improvements
- **Horizontal Scaling**: Stateless design enables load balancing
- **Database Integration**: Persistent metadata storage
- **Processing Queues**: Background processing for large files
- **Microservice Split**: Separate processing service for heavy operations

## Common Pitfalls & Design Decisions

### Why Local Storage vs Cloud Storage?
- **Development Simplicity**: No cloud dependencies for local development
- **Cost Control**: Avoid cloud storage costs during development
- **Migration Path**: Easy transition to cloud storage in production
- **Performance**: Local storage provides consistent performance for testing

### Why UUID Filenames vs Original Names?
- **Security**: Prevents enumeration and guessing of file URLs
- **Uniqueness**: Guarantees no filename conflicts across uploads
- **Privacy**: Obscures original filenames from unauthorized access
- **Scalability**: Enables distributed storage without naming conflicts

### Why Presigned URLs vs Direct Access?
- **Security**: Time-limited access without exposing storage credentials
- **Scalability**: Reduces server load by enabling direct client access
- **Flexibility**: Easy integration with CDNs and cloud storage
- **Control**: Granular access control and audit capabilities

### File Validation Strategy
- **MIME Type + Magic Numbers**: Prevents file type spoofing attacks
- **Size Limits**: Protects against DoS attacks and storage abuse
- **Content Scanning**: Prevents malicious file uploads
- **Whitelist Approach**: Only allow explicitly permitted file types

## Future Improvements

### Short-term Enhancements
- **Image Processing**: Automatic resizing, format conversion, and optimization
- **Video Processing**: Thumbnail generation and format transcoding
- **Advanced Search**: Full-text search within document content
- **Batch Operations**: Bulk upload and management capabilities

### Long-term Considerations
- **AI Integration**: Automatic content tagging and categorization
- **Blockchain Storage**: Immutable file storage for legal documents
- **Edge Computing**: Distributed processing for global performance
- **Advanced Analytics**: File usage patterns and optimization insights

### Scalability Improvements
- **Microservice Architecture**: Separate processing and storage services
- **Event Sourcing**: Complete audit trail of file operations
- **CQRS Pattern**: Optimized read/write models for file metadata
- **GraphQL API**: Flexible file metadata queries for mobile applications