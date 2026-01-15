# ChannelIQ - Enterprise Communication Platform

> A comprehensive corporate communication and collaboration platform built with microservices architecture, featuring real-time messaging, video conferencing, and professional networking.

## 📺 Demo Video

**[▶️ Watch Demo Video](https://github.com/CodeSahil21/ChannelIQ/blob/Main/docs/videos/channellQ.mp4)**

<details>
<summary>📹 How to embed video (click to expand)</summary>

1. Go to https://github.com/CodeSahil21/ChannelIQ
2. Click "Edit" on README.md
3. Delete this section
4. Drag-drop `channellQ.mp4` directly into the editor
5. GitHub will auto-generate: `https://github.com/user-attachments/assets/xxxxx/channellQ.mp4`
6. Commit - video will play inline!

</details>

## 🚀 Overview

ChannelIQ is an enterprise-grade communication platform designed for corporate teams to collaborate, communicate, and manage professional relationships. Built with a modern microservices architecture, it provides secure authentication, real-time messaging, video conferencing, and professional networking capabilities.

### Key Features

- 🔐 **Secure Authentication** - JWT-based auth with HTTP-only cookies and OTP verification
- 💬 **Real-time Messaging** - WebSocket-powered instant messaging with typing indicators
- 👥 **Group Management** - Create and manage groups with role-based permissions
- 📊 **Polls & Announcements** - Interactive polls and group announcements
- 🎥 **Video Conferencing** - LiveKit-powered HD video meetings with screen sharing
- 🤝 **Professional Networking** - Connect with colleagues and manage professional relationships
- 📁 **File Sharing** - Upload and share images, videos, and documents
- 🌓 **Dark Mode** - Beautiful light and dark themes

## 🏗️ Architecture

```
┌─────────────────┐
│   React Client  │ (Port 3000)
│   TypeScript    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Gateway   │ (Port 4000)
└────────┬────────┘
         │
    ┌────┴────┬────────────┬──────────────┬──────────────┐
    ▼         ▼            ▼              ▼              ▼
┌────────┐ ┌──────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Auth  │ │ User │ │   Chat   │ │  Media   │ │ Meeting  │
│ (3001) │ │(3002)│ │  (3004)  │ │  (3003)  │ │  (3005)  │
└────────┘ └──────┘ └──────────┘ └──────────┘ └──────────┘
     │         │          │            │            │
     └─────────┴──────────┴────────────┴────────────┘
                         │
                    ┌────┴────┐
                    ▼         ▼
              ┌──────────┐ ┌──────┐
              │PostgreSQL│ │Redis │
              └──────────┘ └──────┘
                    │
                    ▼
              ┌──────────┐
              │  Kafka   │
              └──────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Redux Toolkit** for state management
- **Socket.IO Client** for real-time features
- **LiveKit** for video conferencing
- **Framer Motion** for animations
- **Vite** for fast builds

### Backend Services
- **Node.js** with TypeScript
- **Express** for REST APIs
- **Prisma** ORM with PostgreSQL
- **Redis** for sessions and caching
- **Kafka** for event streaming
- **Socket.IO** for WebSocket connections
- **LiveKit** for video infrastructure

## 📦 Services

### 1. API Gateway (Port 4000)
Central routing service that proxies requests to microservices with CORS, logging, and error handling.

[📖 Detailed Documentation](./services/api-gateway/README.md)

### 2. Auth Service (Port 3001)
Handles user registration, authentication, session management, and password recovery with JWT and OTP verification.

**Key Features:**
- JWT-based authentication with HTTP-only cookies
- Redis session storage
- OTP-based password recovery
- Rate limiting for security
- Kafka event publishing

[📖 Detailed Documentation](./services/auth-service/README.md)

### 3. User Management Service (Port 3002)
Manages user profiles, connections, and professional networking features.

**Key Features:**
- User profile CRUD operations
- Connection requests and management
- User search and discovery
- Profile image upload
- Connection analytics

[📖 Detailed Documentation](./services/user-management-service/README.md)

### 4. Chat Service (Port 3004)
Real-time messaging with group management, polls, and announcements.

**Key Features:**
- Real-time messaging with Socket.IO
- Group creation and management
- Role-based permissions (Admin, Co-Admin, Member)
- Polls and announcements
- Message reactions and pinning
- Typing indicators

[📖 Detailed Documentation](./services/chat-service/README.md)

### 5. Media Service (Port 3003)
Handles file uploads and media management with AWS S3 integration.

**Key Features:**
- Image, video, and document uploads
- AWS S3 storage
- Presigned URL generation
- File type validation
- Size limits and compression

[📖 Detailed Documentation](./services/media-service/README.md)

### 6. Meeting Service (Port 3005)
Video conferencing powered by LiveKit with meeting management.

**Key Features:**
- LiveKit integration for HD video
- Meeting creation and scheduling
- Participant management
- Screen sharing support
- Meeting recordings

[📖 Detailed Documentation](./services/meeting-service/README.md)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Kafka 2.8+
- AWS Account (for S3)
- LiveKit Server

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/CodeSahil21/ChannelIQ.git
cd ChannelIQ
```

2. **Install dependencies**
```bash
# Install all services
npm run install:all

# Or install individually
cd client && npm install
cd services/auth-service && npm install
# ... repeat for other services
```

3. **Setup databases**
```bash
# Create PostgreSQL database
createdb corporatechat

# Run migrations for each service
cd services/auth-service && npx prisma migrate dev
cd services/user-management-service && npx prisma migrate dev
cd services/chat-service && npx prisma migrate dev
cd services/meeting-service && npx prisma migrate dev
```

4. **Configure environment variables**
```bash
# Copy example env files
cp .env.example .env

# Configure each service
# See individual service README for required variables
```

5. **Start services**
```bash
# Start all services (requires Docker)
docker-compose up

# Or start individually
cd services/api-gateway && npm run dev
cd services/auth-service && npm run dev
# ... repeat for other services

# Start client
cd client && npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:4000

## 📝 Environment Variables

Each service requires specific environment variables. See individual service README files for detailed configuration:

- [Client Environment Variables](./client/README.md#environment-variables)
- [Auth Service Environment Variables](./services/auth-service/README.md#environment-variables)
- [User Management Environment Variables](./services/user-management-service/README.md#environment-variables)
- [Chat Service Environment Variables](./services/chat-service/README.md#environment-variables)
- [Media Service Environment Variables](./services/media-service/README.md#environment-variables)
- [Meeting Service Environment Variables](./services/meeting-service/README.md#environment-variables)

## 🔒 Security Features

- **JWT Authentication** with HTTP-only cookies
- **Rate Limiting** on sensitive endpoints
- **CORS** configuration for cross-origin requests
- **Input Validation** with Zod schemas
- **Password Hashing** with bcrypt
- **Session Management** with Redis
- **XSS Protection** with Helmet
- **CSRF Protection** with SameSite cookies

## 🎯 Key Workflows

### User Registration & Login
1. User registers → Auth Service validates → Creates user in DB
2. User logs in → Auth Service validates → Creates JWT → Stores session in Redis
3. JWT stored in HTTP-only cookie → Sent with all requests

### Real-time Messaging
1. User joins group → Socket.IO connection established
2. User sends message → Chat Service validates → Broadcasts to group members
3. Message stored in DB → Kafka event published → Other services notified

### Video Meeting
1. User creates meeting → Meeting Service generates LiveKit token
2. Participants join → LiveKit handles WebRTC connections
3. Meeting events tracked → Stored in DB for history

## 📊 Database Schema

Each service has its own database schema. Key models:

- **Auth Service**: Users, Sessions
- **User Management**: Profiles, Connections, ConnectionRequests
- **Chat Service**: Groups, Messages, Polls, Announcements
- **Meeting Service**: Meetings, Participants

See individual service documentation for detailed schemas.

## 🔄 Event-Driven Architecture

Services communicate via Kafka events:

- **USER_REGISTERED** - New user created
- **USER_DELETED** - User account deleted
- **MESSAGE_SENT** - New message in group
- **FILE_UPLOADED** - Media file uploaded
- **MEETING_CREATED** - New meeting scheduled

## 🚀 Deployment

### Docker Deployment
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Considerations
- Use environment-specific configurations
- Enable HTTPS with SSL certificates
- Configure Redis clustering for high availability
- Set up Kafka cluster for reliability
- Use CDN for static assets
- Implement monitoring and logging
- Set up automated backups

## 🧪 Testing

```bash
# Run tests for all services
npm run test:all

# Run tests for specific service
cd services/auth-service && npm test
```

## 📈 Performance Optimizations

- **Code Splitting** - Lazy loading for routes
- **Redis Caching** - Session and API response caching
- **Database Indexing** - Optimized queries
- **WebSocket Pooling** - Efficient real-time connections
- **CDN Integration** - Fast static asset delivery
- **Compression** - Gzip compression for responses

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 👥 Authors

- **Sahil Singh** - [GitHub](https://github.com/CodeSahil21)

## 🙏 Acknowledgments

- LiveKit for video infrastructure
- Socket.IO for real-time capabilities
- Prisma for database management
- The open-source community

## 📞 Support

For support, email support@channeliQ.com or open an issue on GitHub.

---

**Built with ❤️ for enterprise communication**
