# Meeting Service

## Overview
The Meeting Service handles video conferencing and meeting management for the CorporateChat application.

## Features
- Meeting scheduling
- Video conference room management
- Meeting invitations
- Recording management
- Screen sharing support

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- WebRTC support

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
- `PORT` - Service port (default: 3003)
- `JWT_SECRET` - JWT signing secret
- `WEBRTC_CONFIG` - WebRTC configuration

## API Endpoints
- `GET /health` - Health check
- `POST /meetings` - Create meeting
- `GET /meetings/:id` - Get meeting details
- `PUT /meetings/:id` - Update meeting
- `DELETE /meetings/:id` - Cancel meeting
- `POST /meetings/:id/join` - Join meeting
- `POST /meetings/:id/leave` - Leave meeting
