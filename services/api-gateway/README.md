# API Gateway Service

Central routing service that proxies requests to microservices.

## Port: 4000

## Routes

- `/api/auth/*` → Auth Service (3001)
- `/api/users/*` → User Management Service (3002) 
- `/api/connections/*` → User Management Service (3002)
- `/api/media/*` → Media Service (3003)

## Features

- Request/response logging
- CORS configuration
- Error handling
- Health check endpoint

## Environment Variables

```env
PORT=4000
```

## Usage

```bash
npm install
npm run dev
```

## Health Check

```bash
GET http://localhost:4000/health
```