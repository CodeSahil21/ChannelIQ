# User Management Service

## Overview
The User Management Service handles user profiles, roles, and permissions for the CorporateChat application.

## Features
- User profile management
- Role-based access control
- User permissions
- Organization management
- User search and discovery

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database

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
- `PORT` - Service port (default: 3004)
- `JWT_SECRET` - JWT signing secret

## API Endpoints
- `GET /health` - Health check
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/search` - Search users
- `POST /users/roles` - Assign role to user
- `GET /organizations` - Get organizations
- `POST /organizations` - Create organization
