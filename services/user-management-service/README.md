# User Management Service

Manages user profiles, connections, and social features.

## Port: 3002

## Features

- Complete user profile management
- Connection system (send/accept/decline requests)
- User blocking/unblocking
- User search functionality
- Direct MinIO public image URLs
- Kafka event publishing

## API Endpoints

### Profile Management
- `POST /api/v1/user-management/create-profile` - Create user profile
- `GET /api/v1/user-management/get-profile` - Get current user profile
- `PUT /api/v1/user-management/update-profile` - Update profile
- `DELETE /api/v1/user-management/delete-profile` - Delete profile
- `GET /api/v1/user-management/search` - Search users
- `GET /api/v1/user-management/fetch-profile/:userId` - Get user profile by ID

### Connections
- `POST /api/v1/connections/request` - Send connection request
- `PUT /api/v1/connections/request/:id/accept` - Accept connection request
- `PUT /api/v1/connections/request/:id/decline` - Decline connection request
- `GET /api/v1/connections/pending` - Get pending requests
- `GET /api/v1/connections/sent` - Get sent requests
- `GET /api/v1/connections/list` - Get all connections
- `GET /api/v1/connections/users` - Get connected users
- `GET /api/v1/connections/status/:userId` - Get connection status
- `GET /api/v1/connections/stats` - Get connection statistics
- `POST /api/v1/connections/block/:userId` - Block user
- `DELETE /api/v1/connections/block/:userId` - Unblock user
- `DELETE /api/v1/connections/remove/:userId` - Remove connection

## Environment Variables

```env
PORT=3002
JWT_SECRET=<jwt_secret>
DATABASE_URL=<postgresql_url>
REDIS_HOST=<redis_host>
REDIS_PORT=<redis_port>
KAFKA_BROKER=localhost:9092
MINIO_PUBLIC_URL=http://localhost:9000
MINIO_BUCKET_NAME=profile-images
```

## Database Schema

- User profiles with personal/professional information
- Connections table for relationship management
- Activity logging for audit trails

## Image Handling

Uses direct MinIO public URLs for profile images:
- Format: `http://localhost:9000/profile-images/{filename}`
- No API calls required for image display
- Automatic URL construction in image service

## Usage

```bash
npm install
npx prisma migrate dev
npm run dev
```