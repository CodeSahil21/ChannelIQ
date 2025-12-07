# User Management Service API Documentation

## Overview
Microservice for managing user profiles, connections, preferences, and social features.

**Base URL:** `http://localhost:3002/api/v1`

**Tech Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Kafka

---

## Table of Contents
- [Authentication](#authentication)
- [Profile Management](#profile-management)
- [Connection Management](#connection-management)
- [User Preferences](#user-preferences)
- [Error Handling](#error-handling)

---

## Authentication

All endpoints require authentication via JWT token in HTTP-only cookie.

**Cookie Name:** `token`

**Unauthorized Response:** `401 Unauthorized`
```json
{
  "success": false,
  "message": "Unauthorized - No token provided"
}
```

---

## Profile Management

Base path: `/user-management`

### 1. Create Profile

Create user profile (one-time setup after registration).

**Endpoint:** `POST /user-management/create-profile`

**Authentication:** Required

**Request Body:**
```json
{
  "fullName": "John Doe",
  "jobTitle": "Software Engineer",
  "department": "Engineering",
  "phoneNumber": "+1234567890",
  "workEmail": "john.doe@company.com",
  "bio": "Passionate developer",
  "location": "San Francisco, CA",
  "timezone": "America/Los_Angeles",
  "skills": ["JavaScript", "TypeScript", "React"],
  "languages": ["English", "Spanish"],
  "managerId": 5,
  "managerName": "Jane Smith",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "portfolioUrl": "https://johndoe.dev",
  "twitterUrl": "https://twitter.com/johndoe"
}
```

**Required Fields:**
- `fullName`: String (min 1 character)

**Optional Fields:**
- All other fields are optional
- `workEmail`: Must be valid email format if provided
- Social URLs: Must be valid URLs if provided

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    "id": 1,
    "fullName": "John Doe",
    "email": "user@example.com",
    "profilePic": "https://avatar.iran.liara.run/public/42",
    "jobTitle": "Software Engineer",
    "department": "Engineering",
    "profileCreated": true,
    "profileCompletionPercentage": 75,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` - Profile already exists
```json
{
  "success": false,
  "message": "Profile has already been created"
}
```

---

### 2. Update Profile

Update existing user profile.

**Endpoint:** `PUT /user-management/update-profile`

**Authentication:** Required

**Request Body:** (All fields optional)
```json
{
  "fullName": "John Doe Updated",
  "jobTitle": "Senior Software Engineer",
  "bio": "Updated bio"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "fullName": "John Doe Updated",
    "profileCompletionPercentage": 80
  }
}
```

**Error Responses:**

`400 Bad Request` - No fields to update
```json
{
  "success": false,
  "message": "No valid fields provided for update"
}
```

---

### 3. Get Own Profile

Retrieve authenticated user's profile.

**Endpoint:** `GET /user-management/get-profile`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "John Doe",
    "email": "user@example.com",
    "profilePic": "https://avatar.iran.liara.run/public/42",
    "jobTitle": "Software Engineer",
    "department": "Engineering",
    "phoneNumber": "+1234567890",
    "workEmail": "john.doe@company.com",
    "bio": "Passionate developer",
    "location": "San Francisco, CA",
    "timezone": "America/Los_Angeles",
    "skills": ["JavaScript", "TypeScript"],
    "languages": ["English"],
    "profileCreated": true,
    "profileCompletionPercentage": 75,
    "status": "ACTIVE",
    "isOnline": true,
    "lastSeen": "2024-01-15T10:30:00.000Z",
    "preference": {
      "emailNotifications": true,
      "pushNotifications": true,
      "theme": "LIGHT"
    }
  }
}
```

---

### 4. Get User Profile by ID

Fetch another user's profile.

**Endpoint:** `GET /user-management/fetch-profile/:userId`

**Authentication:** Required

**Path Parameters:**
- `userId`: Integer (user ID)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 2,
    "fullName": "Jane Smith",
    "profilePic": "https://avatar.iran.liara.run/public/15",
    "jobTitle": "Product Manager",
    "department": "Product"
  }
}
```

**Error Responses:**

`400 Bad Request` - Invalid user ID
```json
{
  "success": false,
  "message": "Invalid user ID"
}
```

`404 Not Found` - User not found
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 5. Delete Profile

Soft delete user profile (deactivate account).

**Endpoint:** `DELETE /user-management/delete-profile`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

---

### 6. Restore User

Restore a soft-deleted user account.

**Endpoint:** `POST /user-management/restore-user/:userId`

**Authentication:** Required

**Path Parameters:**
- `userId`: Integer (user ID to restore)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "User restored successfully"
}
```

---

### 7. Search Users

Search for users by name, email, job title, or department.

**Endpoint:** `GET /user-management/search`

**Authentication:** Required

**Query Parameters:**
- `query`: String (search term, min 1 char, max 100 chars) - Required
- `limit`: String (number of results, default: 10) - Optional

**Example:**
```
GET /user-management/search?query=john&limit=20
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fullName": "John Doe",
      "email": "john@example.com",
      "profilePic": "https://avatar.iran.liara.run/public/42",
      "jobTitle": "Software Engineer",
      "department": "Engineering"
    }
  ]
}
```

---

## Connection Management

Base path: `/connections`

### Connection Status Types
- `PENDING`: Request sent, awaiting response
- `ACCEPTED`: Connection established
- `DECLINED`: Request declined
- `BLOCKED`: User blocked

---

### 1. Send Connection Request

Send a connection request to another user.

**Endpoint:** `POST /connections/request`

**Authentication:** Required

**Request Body:**
```json
{
  "receiverId": 5,
  "message": "Hi! Let's connect"
}
```

**Validation:**
- `receiverId`: Positive integer (required)
- `message`: String (optional)

**Success Response:** `201 Created`
```json
{
  "success": true,
  "message": "Connection request sent successfully",
  "data": {
    "id": 10,
    "senderId": 1,
    "receiverId": 5,
    "status": "PENDING",
    "message": "Hi! Let's connect",
    "sender": {
      "id": 1,
      "fullName": "John Doe",
      "profilePic": "https://avatar.iran.liara.run/public/42",
      "jobTitle": "Software Engineer"
    },
    "receiver": {
      "id": 5,
      "fullName": "Jane Smith",
      "profilePic": "https://avatar.iran.liara.run/public/15"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` - Cannot send to yourself
```json
{
  "success": false,
  "message": "Cannot send connection request to yourself"
}
```

`409 Conflict` - Request already exists
```json
{
  "success": false,
  "message": "Connection request already pending"
}
```

---

### 2. Accept Connection Request

Accept a pending connection request.

**Endpoint:** `PUT /connections/request/:connectionId/accept`

**Authentication:** Required

**Path Parameters:**
- `connectionId`: Integer (connection request ID)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Connection request accepted successfully",
  "data": {
    "id": 10,
    "status": "ACCEPTED"
  }
}
```

**Error Responses:**

`403 Forbidden` - Not authorized
```json
{
  "success": false,
  "message": "You are not authorized to accept this connection request"
}
```

`404 Not Found` - Request not found
```json
{
  "success": false,
  "message": "Connection request not found"
}
```

---

### 3. Decline Connection Request

Decline a pending connection request.

**Endpoint:** `PUT /connections/request/:connectionId/decline`

**Authentication:** Required

**Path Parameters:**
- `connectionId`: Integer

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Connection request declined successfully",
  "data": {
    "id": 10,
    "status": "DECLINED"
  }
}
```

---

### 4. Block User

Block a user (prevents all interactions).

**Endpoint:** `POST /connections/block/:userId`

**Authentication:** Required

**Path Parameters:**
- `userId`: Integer (user to block)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

**Error Responses:**

`400 Bad Request` - Cannot block yourself
```json
{
  "success": false,
  "message": "Cannot block yourself"
}
```

---

### 5. Unblock User

Unblock a previously blocked user.

**Endpoint:** `DELETE /connections/block/:userId`

**Authentication:** Required

**Path Parameters:**
- `userId`: Integer

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

### 6. Remove Connection

Remove an existing connection.

**Endpoint:** `DELETE /connections/remove/:userId`

**Authentication:** Required

**Path Parameters:**
- `userId`: Integer (connected user to remove)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Connection removed successfully"
}
```

---

### 7. Get Pending Requests

Get connection requests received by the user.

**Endpoint:** `GET /connections/pending`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Pending requests retrieved successfully",
  "data": [
    {
      "id": 10,
      "senderId": 5,
      "receiverId": 1,
      "status": "PENDING",
      "message": "Let's connect!",
      "sender": {
        "id": 5,
        "fullName": "Jane Smith",
        "profilePic": "https://avatar.iran.liara.run/public/15",
        "jobTitle": "Product Manager"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 8. Get Sent Requests

Get connection requests sent by the user.

**Endpoint:** `GET /connections/sent`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Sent requests retrieved successfully",
  "data": [
    {
      "id": 11,
      "senderId": 1,
      "receiverId": 6,
      "status": "PENDING",
      "receiver": {
        "id": 6,
        "fullName": "Bob Johnson"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 9. Get All Connections

Get all accepted connections.

**Endpoint:** `GET /connections/list`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Connections retrieved successfully",
  "data": [
    {
      "id": 12,
      "status": "ACCEPTED",
      "sender": {
        "id": 5,
        "fullName": "Jane Smith",
        "profilePic": "https://avatar.iran.liara.run/public/15",
        "jobTitle": "Product Manager",
        "department": "Product"
      },
      "connectedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 10. Get Connected Users

Get simplified list of connected users.

**Endpoint:** `GET /connections/users`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Connected users retrieved successfully",
  "data": [
    {
      "id": 5,
      "fullName": "Jane Smith",
      "profilePic": "https://avatar.iran.liara.run/public/15",
      "jobTitle": "Product Manager",
      "department": "Product",
      "isOnline": true,
      "lastSeen": "2024-01-15T10:30:00.000Z",
      "connectionId": 12,
      "connectedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 11. Get Blocked Users

Get list of blocked users.

**Endpoint:** `GET /connections/blocked`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Blocked users retrieved successfully",
  "data": [
    {
      "id": 13,
      "status": "BLOCKED",
      "receiver": {
        "id": 7,
        "fullName": "Blocked User"
      }
    }
  ]
}
```

---

### 12. Get Connection Status

Check connection status with a specific user.

**Endpoint:** `GET /connections/status/:userId`

**Authentication:** Required

**Path Parameters:**
- `userId`: Integer

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Connection status retrieved successfully",
  "data": {
    "status": "CONNECTED"
  }
}
```

**Possible Status Values:**
- `NONE`: No connection
- `SENT`: Request sent by current user
- `RECEIVED`: Request received from other user
- `CONNECTED`: Connection established
- `BLOCKED`: User is blocked

---

### 13. Get Connection Statistics

Get user's connection statistics.

**Endpoint:** `GET /connections/stats`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Connection statistics retrieved successfully",
  "data": {
    "totalAcceptedConnections": 25,
    "totalPendingConnections": 3
  }
}
```

---

## User Preferences

Base path: `/user-management/preferences`

### 1. Get Preferences

Retrieve user preferences.

**Endpoint:** `GET /user-management/preferences`

**Authentication:** Required

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "emailNotifications": true,
    "pushNotifications": true,
    "connectionRequests": true,
    "profileViews": true,
    "profileVisibility": "PUBLIC",
    "showOnlineStatus": true,
    "showLastSeen": true,
    "theme": "LIGHT",
    "language": "en",
    "timezone": "UTC",
    "appearInSearch": true,
    "showSuggestions": true
  }
}
```

---

### 2. Update Preferences

Update user preferences.

**Endpoint:** `PUT /user-management/preferences`

**Authentication:** Required

**Request Body:** (All fields optional)
```json
{
  "emailNotifications": false,
  "pushNotifications": true,
  "theme": "DARK",
  "profileVisibility": "CONNECTIONS_ONLY"
}
```

**Field Types:**
- **Booleans:** `emailNotifications`, `pushNotifications`, `connectionRequests`, `profileViews`, `showOnlineStatus`, `showLastSeen`, `appearInSearch`, `showSuggestions`
- **Enums:**
  - `profileVisibility`: `PUBLIC`, `CONNECTIONS_ONLY`, `PRIVATE`
  - `theme`: `LIGHT`, `DARK`, `SYSTEM`
- **Strings:** `language`, `timezone`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "userId": 1,
    "theme": "DARK",
    "emailNotifications": false
  }
}
```

**Error Responses:**

`400 Bad Request` - Invalid value
```json
{
  "success": false,
  "message": "theme must be one of: LIGHT, DARK, SYSTEM"
}
```

---

## Error Handling

### Standard Error Response
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
| 403 | Forbidden - Not authorized for action |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource conflict |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

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

### USER_PROFILE_CREATED
Published when user creates profile.
```json
{
  "eventType": "USER_PROFILE_CREATED",
  "userId": 1,
  "email": "user@example.com",
  "fullName": "John Doe",
  "profilePic": "https://avatar.iran.liara.run/public/42",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### USER_DELETED
Published when user deletes account.
```json
{
  "eventType": "USER_DELETED",
  "userId": 1,
  "email": "user@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Environment Variables

```env
# Server
PORT=3002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/user_management_db

# JWT
JWT_SECRET=your-secret-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=

# Kafka
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=user-management-service
KAFKA_CONSUMER_GROUP_ID=user-management-service-group

# Frontend
FRONTEND_URLS=http://localhost:3000,http://localhost:5173
```

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

### Create Profile
```bash
curl -X POST http://localhost:3002/api/v1/user-management/create-profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"fullName":"John Doe","jobTitle":"Engineer"}'
```

### Send Connection Request
```bash
curl -X POST http://localhost:3002/api/v1/connections/request \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"receiverId":5,"message":"Let'\''s connect!"}'
```

### Search Users
```bash
curl -X GET "http://localhost:3002/api/v1/user-management/search?query=john&limit=10" \
  -b cookies.txt
```

---

## Support

For issues or questions, please contact the development team.
