# CorporateChat

A microservices-based corporate communication platform with user management, connections, and media handling.

## Architecture

- **API Gateway** (Port 4000) - Routes requests to microservices
- **Auth Service** (Port 3001) - Authentication and authorization
- **User Management Service** (Port 3002) - User profiles and connections
- **Media Service** (Port 3003) - File uploads and media handling
- **Client** (Port 3000/5173) - React frontend

## Tech Stack

### Backend
- Node.js + TypeScript + Express
- PostgreSQL (Prisma ORM)
- Redis (Session management)
- Apache Kafka (Event streaming)
- MinIO (Object storage with public access)

### Frontend
- React + TypeScript + Vite
- Redux Toolkit (State management)
- Tailwind CSS (Styling)
- Framer Motion (Animations)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis
- Apache Kafka
- MinIO

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd CorporateChat
npm install
cd client && npm install
cd ../services && npm install
```

2. **Setup environment files:**
   - Copy `.env.example` to `.env` in each service directory
   - Configure database, Redis, Kafka, and MinIO connections

3. **Start infrastructure:**
```bash
# Start PostgreSQL, Redis, Kafka, MinIO
# Configure MinIO bucket 'profile-images' with public read access
```

4. **Start services:**
```bash
# Terminal 1 - API Gateway
cd services/api-gateway && npm run dev

# Terminal 2 - Auth Service  
cd services/auth-service && npm run dev

# Terminal 3 - User Management
cd services/user-management-service && npm run dev

# Terminal 4 - Media Service
cd services/media-service && npm run dev

# Terminal 5 - Client
cd client && npm run dev
```

## Key Features

- **User Authentication** - JWT-based auth with session management
- **User Profiles** - Complete profile management with skills, bio, social links
- **Connections** - Send/accept/decline connection requests, blocking
- **Media Upload** - Profile image upload with direct MinIO public URLs
- **Real-time Events** - Kafka-based event streaming between services
- **Caching** - Redis caching for performance optimization

## API Endpoints

### Auth Service (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /verify-otp` - OTP verification
- `POST /forgot-password` - Password reset

### User Management (`/api/users`, `/api/connections`)
- `POST /api/users/create-profile` - Create user profile
- `GET /api/users/get-profile` - Get current user profile
- `PUT /api/users/update-profile` - Update profile
- `GET /api/users/search` - Search users
- `POST /api/connections/request` - Send connection request
- `PUT /api/connections/request/:id/accept` - Accept request
- `GET /api/connections/list` - Get connections

### Media Service (`/api/media`)
- `POST /upload-profile-image` - Upload profile image
- `DELETE /delete-profile-image` - Delete profile image

## Environment Variables

### Common
```env
PORT=<service_port>
JWT_SECRET=<jwt_secret>
DATABASE_URL=<postgresql_url>
REDIS_HOST=<redis_host>
REDIS_PORT=<redis_port>
KAFKA_BROKER=localhost:9092
```

### Media Service Additional
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=profile-images
MINIO_PUBLIC_URL=http://localhost:9000
```

## Development

- **Database migrations:** `npx prisma migrate dev`
- **Generate Prisma client:** `npx prisma generate`
- **View database:** `npx prisma studio`

## Production Notes

- Configure proper CORS origins
- Use production database credentials
- Set up proper MinIO bucket policies
- Configure Kafka cluster
- Use environment-specific Redis instance