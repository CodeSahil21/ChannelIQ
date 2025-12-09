# Auth Service API Documentation

## Overview
Authentication microservice handling user registration, login, session management, and password recovery.

**Base URL:** `http://localhost:3001/api/v1/auth`

**Tech Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Kafka

---

## Table of Contents
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

### Cookie-Based Authentication
All protected endpoints require a valid JWT token stored in an HTTP-only cookie named `token`.

**Cookie Properties:**
- Name: `token`
- HttpOnly: `true`
- SameSite: `none` (production) / `strict` (development)
- Secure: `true` (production only)
- Max-Age: 7 days

---

## Endpoints

### 1. Register User

Create a new user account.

**Endpoint:** `POST /register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Valid email format (required)
- `password`: Minimum 6 characters (required)

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

**Error Responses:**

`400 Bad Request` - Validation failed
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

`409 Conflict` - Email already registered
```json
{
  "success": false,
  "message": "Email already registered"
}
```

`429 Too Many Requests` - Rate limit exceeded
```json
{
  "success": false,
  "message": "Too many registration attempts. Please try again later"
}
```

---

### 2. Login

Authenticate user and create session.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

**Error Responses:**

`401 Unauthorized` - Invalid credentials
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

`429 Too Many Requests` - Rate limit exceeded
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again later"
}
```

`429 Too Many Requests` - Too many failed attempts
```json
{
  "success": false,
  "message": "Too many failed attempts. Please try again after 15 minutes"
}
```

---

### 3. Get Profile

Retrieve authenticated user's profile.

**Endpoint:** `GET /get-profile`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

**Error Responses:**

`401 Unauthorized` - No token or invalid token
```json
{
  "success": false,
  "message": "Unauthorized - No token provided"
}
```

---

### 4. Logout

Terminate user session.

**Endpoint:** `POST /logout`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5. Forgot Password

Request OTP for password reset.

**Endpoint:** `POST /forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "OTP sent to your email address"
}
```

**Note:** Returns success even if email doesn't exist (security best practice).

---

### 6. Verify OTP

Verify the OTP sent to email.

**Endpoint:** `POST /verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Validation Rules:**
- `otp`: Exactly 6 digits (required)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

**Error Responses:**

`400 Bad Request` - Invalid or expired OTP
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

### 7. Reset Password

Reset password using verified OTP.

**Endpoint:** `POST /reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Validation Rules:**
- `newPassword`: Minimum 8 characters (required)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses:**

`400 Bad Request` - Invalid or expired OTP
```json
{
  "success": false,
  "message": "OTP has expired"
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Authentication required |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database/External service error |

---

## Rate Limiting & Security Features

### Rate Limiting (Per IP Address)

**Login Endpoint:**
- **Limit:** 10 attempts per 15 minutes
- **Response:** `429 Too Many Requests`
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again later"
}
```

**Registration Endpoint:**
- **Limit:** 3 attempts per hour
- **Response:** `429 Too Many Requests`
```json
{
  "success": false,
  "message": "Too many registration attempts. Please try again later"
}
```

### Failed Login Protection

**Automatic Account Protection:**
- **Limit:** 5 failed login attempts per email
- **Lockout Duration:** 15 minutes
- **Response:** `429 Too Many Requests`
```json
{
  "success": false,
  "message": "Too many failed attempts. Please try again after 15 minutes"
}
```

**How it works:**
1. Each failed login increments a counter (stored in Redis)
2. After 5 failed attempts, the account is temporarily locked
3. Counter automatically expires after 15 minutes
4. Successful login clears the counter

### OTP Security

**OTP Storage:**
- Stored in Redis cache (not database)
- **Expiration:** 10 minutes
- **Format:** 6-digit numeric code
- Automatically deleted after successful password reset

**OTP Flow:**
1. User requests password reset → OTP generated and cached
2. OTP sent via email
3. User verifies OTP → Validated against cache
4. User resets password → OTP deleted from cache

---

## Health Check

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "services": {
    "kafka": "connected",
    "database": "connected"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Event Publishing (Kafka)

The service publishes the following events:

### USER_REGISTERED
Published when a new user registers.
```json
{
  "eventType": "USER_REGISTERED",
  "userId": 1,
  "email": "user@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### USER_LOGGED_IN
Published when a user logs in.
```json
{
  "eventType": "USER_LOGGED_IN",
  "userId": 1,
  "email": "user@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### USER_LOGGED_OUT
Published when a user logs out.
```json
{
  "eventType": "USER_LOGGED_OUT",
  "userId": 1,
  "email": "user@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/auth_db

# JWT
JWT_SECRET=your-secret-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_USE_TLS=false

# Kafka
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=auth-service
KAFKA_CONSUMER_GROUP_ID=auth-service-group

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
FRONTEND_URLS=http://localhost:3000,http://localhost:5173
```

---

## Security Features

### Authentication & Authorization
- **Password Hashing:** bcrypt with salt rounds
- **JWT Tokens:** Signed with HS256 algorithm, 7-day expiration
- **Session Management:** Redis-based with automatic expiration
- **Token Blacklisting:** Revoked tokens stored in Redis
- **CSRF Protection:** SameSite cookie attribute

### Rate Limiting & Brute Force Protection
- **Login Rate Limiting:** 10 attempts per 15 minutes per IP
- **Registration Rate Limiting:** 3 attempts per hour per IP
- **Failed Login Protection:** 5 attempts per email, 15-minute lockout
- **Redis-Based Counters:** Automatic expiration and cleanup

### Data Protection
- **Input Validation:** Zod schema validation on all endpoints
- **SQL Injection Prevention:** Prisma ORM with parameterized queries
- **XSS Protection:** Helmet security headers
- **CORS:** Configurable allowed origins
- **Secure Cookies:** HttpOnly, Secure (production), SameSite

### OTP & Password Reset
- **OTP Storage:** Redis cache (10-minute expiration)
- **OTP Format:** 6-digit numeric, cryptographically random
- **Email Delivery:** SMTP with TLS
- **One-Time Use:** OTP deleted after successful reset

### Caching Strategy

**Cache Keys:**
- `auth:session:{jti}` - User sessions (7 days)
- `auth:blacklist:{jti}` - Revoked tokens (TTL matches token expiration)
- `auth:failed:{email}` - Failed login attempts (15 minutes)
- `auth:otp:{email}` - Password reset OTPs (10 minutes)
- `ratelimit:login:{ip}` - Login rate limiting (15 minutes)
- `ratelimit:register:{ip}` - Registration rate limiting (1 hour)

**Cache Benefits:**
- Reduced database load
- Faster authentication checks
- Automatic expiration of sensitive data
- Improved rate limiting accuracy

---

## Development

### Install Dependencies
```bash
npm install
```

### Run Migrations
```bash
npm run prisma:migrate
```

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Profile
```bash
curl -X GET http://localhost:3001/api/v1/auth/get-profile \
  -b cookies.txt
```

---

## Support

For issues or questions, please contact the development team.
