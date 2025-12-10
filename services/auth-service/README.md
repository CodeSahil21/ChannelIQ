# Auth Service

Handles user authentication, registration, and session management.

## Port: 3001

## Features

- User registration with email verification
- JWT-based authentication
- OTP verification
- Password reset functionality
- Session management with Redis
- Token blacklisting

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

## Environment Variables

```env
PORT=3001
JWT_SECRET=<jwt_secret>
DATABASE_URL=<postgresql_url>
REDIS_HOST=<redis_host>
REDIS_PORT=<redis_port>
REDIS_PASSWORD=<redis_password>
KAFKA_BROKER=localhost:9092
```

## Database Schema

- Users table with email, password, verification status
- OTP management for verification
- Session tracking

## Usage

```bash
npm install
npx prisma migrate dev
npm run dev
```