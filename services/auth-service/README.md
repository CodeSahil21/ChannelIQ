# Authentication Service API Documentation

## Overview
The Authentication Service is a core microservice in the CorporateChat platform responsible for user registration, authentication, session management, and password recovery. It provides secure JWT-based authentication with Redis session storage and comprehensive security features including rate limiting and OTP verification.

**Service Port:** 3001  
**API Gateway Endpoint:** `http://localhost:4000/api/auth`

---

## Authentication Workflow

### Step 1: User Registration
Call `POST /api/auth/register` with email and password to create a new user account.

### Step 2: User Login
Call `POST /api/auth/login` with credentials. The service returns user data and sets a secure HTTP-only cookie containing the JWT token.

### Step 3: Token Management
- **Access Token:** Stored as HTTP-only cookie (7-day expiration)
- **Session Storage:** Redis-based session management with JTI (JWT ID) tracking
- **Security:** Automatic token blacklisting on logout

### Step 4: Protected Routes
Include the cookie in subsequent requests. The service validates the token and session automatically.

### Step 5: Password Recovery
Use the forgot password → verify OTP → reset password flow for account recovery.

---

## API Reference

### POST /api/auth/register
**Description:** Register a new user account

**Request Schema:**
```typescript
{
  email: string;     // Valid email format, automatically lowercased and trimmed
  password: string;  // Minimum 6 characters
}
```

**Validation Rules:**
- `email`: Must be valid email format
- `password`: Minimum 6 characters

**Success Response (201):**
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

**Rate Limiting:** 3 attempts per hour per IP

---

### POST /api/auth/login
**Description:** Authenticate user and create session

**Request Schema:**
```typescript
{
  email: string;     // Valid email format
  password: string;  // Minimum 6 characters
}
```

**Validation Rules:**
- `email`: Must be valid email format
- `password`: Minimum 6 characters

**Success Response (200):**
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

**Security Features:**
- Failed login tracking (5 attempts = 15-minute lockout)
- Timing attack protection
- Secure HTTP-only cookie with JWT token

**Rate Limiting:** 10 attempts per 15 minutes per IP

---

### GET /api/auth/get-profile
**Description:** Get current authenticated user profile

**Authentication:** Required (JWT token via cookie)

**Success Response (200):**
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

---

### POST /api/auth/logout
**Description:** Logout user and invalidate session

**Authentication:** Required (JWT token via cookie)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Security Actions:**
- Clears HTTP-only cookie
- Removes session from Redis
- Adds token to blacklist (5-minute window)

---

### POST /api/auth/forgot-password
**Description:** Request password reset OTP

**Request Schema:**
```typescript
{
  email: string;  // Valid email format
}
```

**Validation Rules:**
- `email`: Must be valid email format

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email address"
}
```

**Security Note:** Returns success even if email doesn't exist (prevents email enumeration)

**OTP Details:**
- 6-digit numeric code
- 10-minute expiration
- Stored in Redis cache

---

### POST /api/auth/verify-otp
**Description:** Verify OTP for password reset

**Request Schema:**
```typescript
{
  email: string;  // Valid email format
  otp: string;    // Exactly 6 digits
}
```

**Validation Rules:**
- `email`: Must be valid email format
- `otp`: Must be exactly 6 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

---

### POST /api/auth/reset-password
**Description:** Reset password using verified OTP

**Request Schema:**
```typescript
{
  email: string;      // Valid email format
  otp: string;        // Exactly 6 digits
  newPassword: string; // Minimum 8 characters
}
```

**Validation Rules:**
- `email`: Must be valid email format
- `otp`: Must be exactly 6 characters
- `newPassword`: Minimum 8 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Security Actions:**
- Verifies OTP before password change
- Hashes new password with bcrypt
- Removes OTP from cache after use

---

## Shared Types

```typescript
// User object returned in responses
interface User {
  id: number;
  email: string;
}

// Standard API response structure
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: FieldError[];
}

// Validation error structure
interface FieldError {
  field: string;
  message: string;
}

// Authentication request interface
interface AuthenticatedRequest extends Request {
  user?: User;
  sessionJti?: string;
}
```

---

## Error Handling

| HTTP Status | Error Code | Message | Frontend Action |
|-------------|------------|---------|-----------------|
| **400** | Validation Error | "Validation failed" | Display field-specific errors |
| **401** | Unauthorized | "Unauthorized - No token provided" | Redirect to login |
| **401** | Unauthorized | "Unauthorized - Invalid token" | Clear local auth state, redirect to login |
| **401** | Unauthorized | "Unauthorized - Token expired" | Clear local auth state, redirect to login |
| **401** | Unauthorized | "Unauthorized - Session expired" | Clear local auth state, redirect to login |
| **401** | Unauthorized | "Unauthorized - Token revoked" | Clear local auth state, redirect to login |
| **401** | Invalid Credentials | "Invalid credentials" | Show login error message |
| **409** | Conflict | "Email already registered" | Show registration error, suggest login |
| **429** | Rate Limited | "Too many failed attempts. Please try again after 15 minutes" | Show rate limit message with timer |
| **429** | Rate Limited | "Too many login attempts. Please try again later" | Show rate limit message |
| **429** | Rate Limited | "Too many registration attempts. Please try again later" | Show rate limit message |
| **500** | Server Error | "Internal server error" | Show generic error, retry option |
| **502** | Gateway Error | "Auth service unavailable" | Show service unavailable message |
| **503** | Service Error | "Service temporarily unavailable" | Show temporary error, retry option |

### Validation Error Response Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password", 
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```

---

## Security Features

### Rate Limiting
- **Login:** 10 attempts per 15 minutes per IP
- **Registration:** 3 attempts per hour per IP
- **Failed Login Tracking:** 5 failed attempts = 15-minute account lockout

### Session Management
- JWT tokens with 7-day expiration
- Redis-based session storage with JTI tracking
- Automatic session cleanup on logout
- Token blacklisting for immediate revocation

### Password Security
- bcrypt hashing with salt rounds
- Minimum password requirements
- Timing attack protection during login

### OTP Security
- 6-digit numeric codes
- 10-minute expiration
- Single-use verification
- Redis-based temporary storage

---

## Environment Configuration

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/corporatechat

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Kafka Configuration
KAFKA_BROKER=localhost:9092
```

---

## Development Notes

### Cookie Configuration
- **Development:** `sameSite: 'strict'`, `secure: false`
- **Production:** `sameSite: 'none'`, `secure: true`
- **HttpOnly:** Always `true` for security
- **Path:** `/` for global access

### Event Publishing
The service publishes Kafka events for:
- User registration
- User login
- User logout

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Redis Key Patterns
- Sessions: `session:{jti}`
- Blacklist: `blacklist:{jti}`
- OTP: `auth:otp:{email}`
- Failed attempts: `auth:failed:{email}`
- Rate limiting: `ratelimit:{type}:{ip}`