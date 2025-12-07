# API Gateway Docs

Base URL: `http://localhost:4000`

Health
- GET `/health`
  - Response 200: `{ success: true, message: string, timestamp: string }`

Proxies
- `/api/auth/*` → `http://localhost:3001/api/v1/auth/*`
  - Forwards methods: GET, POST, PUT, DELETE, OPTIONS
  - Sends `Authorization`, `Cookie`, `Content-Type`
  - Strips conditional headers; disables caching headers
  - Error 502: `{ success:false, message:'Auth service unavailable' }`

- `/api/users/*` → `http://localhost:3002/api/v1/user-management/*`
  - User profile and preferences routes. See service docs in `../user-management-service/README.md`.
  - Error 502: `{ success:false, message:'User service unavailable' }`

- `/api/connections/*` → `http://localhost:3002/api/v1/connections/*`
  - Connection-related routes. See service docs.
  - Error 502: `{ success:false, message:'Connection service unavailable' }`

CORS
- Allowed origins: `http://localhost:3000`, `http://localhost:4000`
- Allowed headers: `Content-Type`, `Authorization`, `Cookie`
- Credentials enabled

Notes
- Logs each request and proxy result codes.
- Returns 404 JSON for unknown paths: `{ success:false, message:'Route not found', path:string }`.
