# Auth Service

Comprehensive documentation for the Auth Service that powers registration, authentication, password recovery, and user session management. This service runs behind the API Gateway and publishes user lifecycle events to Kafka.

**Base URL (via API Gateway)**
- Development: `http://localhost:4000/api/auth`

**Internal Service Base**
- Service routes mounted at: `http://localhost:3001/api/v1/auth`
- Health: `http://localhost:3001/health`

**Key Files**
- App bootstrap: `src/app.ts`
- HTTP server: `src/server.ts`
- Routes: `src/routes/auth.routes.ts`
- Controllers: `src/controllers/auth.controller.ts`
- Middleware: `src/middleware/middleware.ts`
- DB client: `src/db/db.ts`
- Auth utils: `src/utils/auth.ts`
- Validation schemas: `src/utils/schema.ts`
- Kafka manager: `src/kafka/kafkaManager.ts`
- Kafka consumer: `src/kafka/consumer.ts`
- Kafka publisher: `src/kafka/publisher.ts`
- Kafka event factory: `src/kafka/userEvents.ts`

## Overview
- Provides user registration, login, logout, profile retrieval, and password reset via OTP.
- Uses JWT stored in an HttpOnly cookie named `token`.
- Publishes user lifecycle events to Kafka topic(s) for other services.
- Uses Prisma for data access and validation via Zod.

## Environment Variables
Set these in `services/auth-service/.env`:
- `DATABASE_URL`: Prisma database connection string.
- `JWT_SECRET`: Secret for signing JWT.
- Email (if OTP emailing is enabled): `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`.
- Kafka: `KAFKA_CLIENT_ID`, `KAFKA_BROKER` (comma-separated), `KAFKA_CONSUMER_GROUP_ID`. Optional tuning keys may exist in code.

## Security
- Password hashing: `utils/auth.ts` (hash/compare using a secure algorithm).
- JWT generation and verification: `utils/auth.ts`.
- OTP generation/expiry helpers: `utils/auth.ts`.
- Protected routes require `protectRoute` middleware to validate the cookie and attach `req.user`.

## Validation
- Zod schemas in `utils/schema.ts`:
	- `CreateUserSchema`
	- `LoginUserSchema`
	- `ForgotPasswordSchema`
	- `VerifyOTPSchema`
	- `ResetPasswordSchema`

## API Gateway
- Proxies `/api/auth/*` to Auth Service `/api/v1/auth/*`.
- Ensure CORS allows credentials and forwards cookies.
	- Gateway implementation: `services/api-gateway/src/server.ts`.

## Endpoints

All examples use the Gateway base: `http://localhost:4000/api/auth`.

### POST `/register`
- Registers a new user and sets a JWT cookie.
- Publishes `USER_REGISTERED` to Kafka.
- Body:
	- `email` (string, valid email)
	- `password` (string, min 6)
- Success 201:
```
{
	"success": true,
	"message": "User created successfully",
	"data": { "user": { "id": <number>, "email": "user@example.com" } }
}
```
- Errors: 400 (validation), 409 (email exists), 503 (dependency), 500 (server)

### POST `/login`
- Logs in user and sets JWT cookie.
- Publishes `USER_LOGGED_IN` to Kafka.
- Body:
	- `email` (string)
	- `password` (string)
- Success 200:
```
{
	"success": true,
	"message": "Login successful",
	"data": { "user": { "id": <number>, "email": "user@example.com" } }
}
```
- Errors: 400 (validation), 401 (invalid credentials), 503, 500

### GET `/get-profile` (authenticated)
- Returns the authenticated user's profile.
- Requires cookie `token` and `protectRoute` middleware.
- Success 200:
```
{
	"success": true,
	"message": "Profile retrieved successfully",
	"data": { "user": { "id": <number>, "email": "user@example.com" } }
}
```
- Errors: 401, 500

### POST `/logout` (authenticated)
- Clears the JWT cookie and publishes `USER_LOGGED_OUT`.
- Success 200:
```
{ "success": true, "message": "Logged out successfully" }
```
- Errors: 500

### POST `/forgot-password`
- Generates a 6-digit OTP, stores expiry (+10 minutes), and emails the OTP.
- Body:
	- `email` (string)
- Success 200:
```
{ "success": true, "message": "OTP sent to your email address" }
```
- Errors: 400, 503, 500

### POST `/verify-otp`
- Verifies OTP for an email. Does not change the password.
- Body:
	- `email` (string)
	- `otp` (string length 6)
- Success 200:
```
{ "success": true, "message": "OTP verified successfully" }
```
- Errors: 400 (invalid/expired), 503, 500

### POST `/reset-password`
- Resets password if OTP is valid and not expired.
- Body:
	- `email` (string)
	- `otp` (string length 6)
	- `newPassword` (string min 8)
- Success 200:
```
{ "success": true, "message": "Password reset successfully" }
```
- Errors: 400 (invalid/expired OTP), 503, 500

### GET `/health` (service direct)
- Health probe (not through gateway), returns status for Kafka and DB.
- Success 200 or 503:
```
{
	"status": "healthy" | "degraded",
	"services": { "kafka": "connected" | "disconnected", "database": "connected" | "disconnected" },
	"timestamp": "<ISO string>"
}
```

## Cookies
- Name: `token`
- Attributes:
	- `HttpOnly: true`
	- `SameSite`: `none` in production, `strict` in development
	- `Secure`: `true` in production
	- `Path`: `/`

## Kafka
- Initialization: `kafka/kafkaManager.ts` sets up admin, producer, consumer, and topics.
- Topics:
	- `user-events` (published): user registered, logged in, logged out
	- `user-management-events` (consumed): e.g., `USER_DELETED` leading to local deletion
- Publisher: `kafka/publisher.ts`
- Consumer: `kafka/consumer.ts`
- Event builders: `kafka/userEvents.ts`
- Health checks: `kafka/kafkaManager.ts`

## Prisma
- Client setup: `src/db/db.ts`
- Schema: `prisma/schema.prisma`
- Typical operations: `findUnique`, `create`, `update`, `delete` in services/controllers.

## Error Handling
- Consistent response envelope with `success`, `message`, optional `data`.
- Validation errors return 400 with per-field details.
- Auth failures return 401.
- Dependency errors (DB/email/Kafka) return 503.
- Unhandled exceptions return 500.

## Local Development

### Install dependencies
```powershell
Push-Location "c:\Sahil Singh Personal\OneDrive\Desktop\Projects\CorporateChat\services\auth-service"; npm install; Pop-Location
```

### Run the service (dev)
```powershell
Push-Location "c:\Sahil Singh Personal\OneDrive\Desktop\Projects\CorporateChat\services\auth-service"; npm run dev; Pop-Location
```

### Run the API Gateway (dev)
```powershell
Push-Location "c:\Sahil Singh Personal\OneDrive\Desktop\Projects\CorporateChat\services\api-gateway"; npm run dev; Pop-Location
```

### Prisma migrations
```powershell
Push-Location "c:\Sahil Singh Personal\OneDrive\Desktop\Projects\CorporateChat\services\auth-service"; npx prisma migrate dev; Pop-Location
```

### Try it quickly
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/register" -Body (@{ email = "user@example.com"; password = "secret123" } | ConvertTo-Json) -ContentType "application/json"
```

## Notes
- All client requests should hit Gateway endpoints (`/api/auth/*`).
- Ensure the gateway forwards cookies and CORS allows credentials.
- Use HTTPS in production so `Secure` cookies work properly.

