# Chat Service

## Overview
The Chat Service handles real-time messaging functionality for the CorporateChat application.

## Features
- Real-time messaging
- Chat room management
- Message history
- User status tracking

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Redis (for real-time features)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

4. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Service port (default: 3002)
- `JWT_SECRET` - JWT signing secret
- `REDIS_URL` - Redis connection string

## API Endpoints
- `GET /health` - Health check
- `POST /chat/messages` - Send message
- `GET /chat/messages/:roomId` - Get chat history
- `POST /chat/rooms` - Create chat room
- `GET /chat/rooms` - Get user's chat rooms
