# User Management Service API Docs

Base URL via API Gateway:
- Users: `http://localhost:4000/api/users` → rewrites to `http://localhost:3002/api/v1/user-management`
- Connections: `http://localhost:4000/api/connections` → rewrites to `http://localhost:3002/api/v1/connections`

Authentication
- Cookie: `token` (JWT). All endpoints require authentication.
- Middleware: [`middleware.protectRoute`](src/middleware/middleware.ts)

---

## Global API Types (Frontend)
Use these in your frontend to type API calls.

```ts
export type ApiSuccess<T> = { success: true; message?: string; data: T };
export type ApiError = { success: false; message?: string; error?: string; errors?: { field: string; message: string }[] };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

---

## Health
- GET `/health`
  - Request: No body
  - Response 200:
    ```json
    { "status": "healthy", "services": { "kafka": "connected", "database": "connected" }, "timestamp": "2025-01-01T00:00:00.000Z" }
    ```
  - Response 503:
    ```json
    { "status": "degraded", "services": { "kafka": "disconnected", "database": "connected" }, "timestamp": "2025-01-01T00:00:00.000Z" }
    ```

---

## Profiles
Routes: [`routes/profile.routes.ts`](src/routes/profile.routes.ts)  
Schemas: [`CreateUserProfileSchema`, `UpdateUserProfileSchema`, `fetchUserProfileSchema`](src/utils/schema.ts)  
Controller: [`profile.controller`](src/controllers/profile.controller.ts)  
Types: [`UserProfileResponse`, `CreateUserProfile`](src/utils/types.ts)

### POST `/create-profile`
- Validation: [`CreateUserProfileSchema`](src/utils/schema.ts)
- Request body (TypeScript):
  ```ts
  export type CreateProfileRequest = {
    fullName: string;
    profilePic?: string;
    jobTitle?: string;
    department?: string;
    phoneNumber?: string;
    workEmail?: string;
    bio?: string;
    location?: string;
    timezone?: string;
    skills?: string[];
    languages?: string[];
    managerId?: number;
    managerName?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    twitterUrl?: string;
  };
  ```
- Example request:
  ```json
  { "fullName": "Jane Doe", "timezone": "UTC", "skills": ["TS","React"], "languages": ["en"] }
  ```
- Response 201 (TypeScript):
  ```ts
  export type CreateProfileApiResponse = ApiResponse<UserProfileResponse>;
  ```
- Example response:
  ```json
  { "success": true, "message": "Profile created successfully", "data": { "id": 1, "fullName": "Jane Doe", "email": "jane@corp.com", "profilePic": "https://avatar.iran.liara.run/public/42", "jobTitle": null, "department": null, "phoneNumber": null, "workEmail": null, "profileCreated": true, "bio": null, "location": null, "timezone": "UTC", "skills": ["TS","React"], "languages": ["en"], "managerId": null, "managerName": null, "linkedinUrl": null, "githubUrl": null, "portfolioUrl": null, "twitterUrl": null, "status": "ACTIVE", "isOnline": false, "lastSeen": null, "createdAt": "2025-01-01T00:00:00.000Z", "updatedAt": "2025-01-01T00:00:00.000Z" } }
  ```
- Errors: 400 validation, 404 user not found, 400 profile already created, 500 internal

### PUT `/update-profile`
- Validation: [`UpdateUserProfileSchema`](src/utils/schema.ts)
- Request body (TypeScript):
  ```ts
  export type UpdateProfileRequest = Partial<CreateProfileRequest>;
  ```
- Example request:
  ```json
  { "jobTitle": "Engineer", "location": "NYC", "skills": ["TS","React","Node"] }
  ```
- Response 200 (TypeScript):
  ```ts
  export type UpdateProfileApiResponse = ApiResponse<UserProfileResponse>;
  ```
- Errors: 400 validation, 404 user not found, 400 not created yet, 500 internal

### GET `/get-profile`
- Request: No body
- Response 200 (TypeScript):
  ```ts
  export type GetProfileApiResponse = ApiResponse<UserProfileResponse>;
  ```
- Example response:
  ```json
  { "success": true, "data": { /* UserProfileResponse */ } }
  ```

### GET `/fetch-profile/:userId`
- Validation: [`fetchUserProfileSchema`](src/utils/schema.ts)
- Params: `{ userId: number }`
- Request: No body
- Response 200 (TypeScript):
  ```ts
  export type FetchProfileApiResponse = ApiResponse<UserProfileResponse>;
  ```
- Errors: 400 invalid id, 404 not found, 500 internal

### DELETE `/delete-profile`
- Request: No body
- Response 200:
  ```json
  { "success": true, "message": "Profile deleted successfully" }
  ```
- TypeScript:
  ```ts
  export type DeleteProfileApiResponse = ApiResponse<{ message: string }>;
  ```

### POST `/restore-user/:userId`
- Params: `{ userId: number }`
- Request: No body
- Response 200:
  ```json
  { "success": true, "message": "User restored successfully" }
  ```
- TypeScript:
  ```ts
  export type RestoreUserApiResponse = ApiResponse<{ message: string }>;
  ```

---

## Preferences
Controller: [`preference.controller`](src/controllers/preference.controller.ts)  
Service validation: [`updateUserPreference`](src/services/preference.service.ts)  
Server types: [`UserPreferenceUpdate`](src/utils/prismaTypes.ts)

### GET `/preferences`
- Request: No body
- Response 200 (TypeScript):
  ```ts
  export type UserPreferenceResponse = {
    id: number; userId: number; createdAt: string; updatedAt: string;
    emailNotifications?: boolean; pushNotifications?: boolean;
    connectionRequests?: boolean; profileViews?: boolean;
    profileVisibility?: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE';
    showOnlineStatus?: boolean; showLastSeen?: boolean;
    theme?: string; language?: string; timezone?: string;
    appearInSearch?: boolean; showSuggestions?: boolean;
  };
  export type GetPreferencesApiResponse = ApiResponse<UserPreferenceResponse>;
  ```
- Example response:
  ```json
  { "success": true, "data": { "id": 1, "userId": 1, "theme": "dark", "language": "en", "timezone": "UTC", "emailNotifications": true, "createdAt": "2025-01-01T00:00:00.000Z", "updatedAt": "2025-01-01T00:00:00.000Z" } }
  ```
- Errors: 404 not found, 500 internal

### PUT `/preferences`
- Request body (validated keys only):
  ```ts
  export type UpdatePreferencesRequest = {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    connectionRequests?: boolean;
    profileViews?: boolean;
    profileVisibility?: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE';
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
    theme?: string;
    language?: string;
    timezone?: string;
    appearInSearch?: boolean;
    showSuggestions?: boolean;
  };
  ```
- Example request:
  ```json
  { "theme": "dark", "language": "en", "emailNotifications": true }
  ```
- Response 200 (TypeScript):
  ```ts
  export type UpdatePreferencesApiResponse = ApiResponse<UserPreferenceResponse>;
  ```
- Errors: 400 validation, 400 no valid fields, 500 internal

---

## Connections
Router: [`routes/connection.routes.ts`](src/routes/connection.routes.ts)  
Schemas: [`sendConnectionRequestSchema`, `connectionIdParamSchema`, `userIdParamSchema`](src/utils/schema.ts)  
Controller: [`connection.controller`](src/controllers/connection.controller.ts)  
Types: [`ConnectionResponse`, `ConnectionStatus`](src/utils/types.ts)

Common types:
```ts
export type SendConnectionRequestBody = { receiverId: number; message?: string };
export type ConnectionIdParam = { connectionId: number };
export type UserIdParam = { userId: number };

export type ConnectionUser = {
  id: number; fullName: string;
  profilePic?: string; jobTitle?: string; department?: string;
};

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';

export type ConnectionResponse = {
  id: number; senderId: number; receiverId: number;
  status: ConnectionStatus; message?: string;
  sender?: ConnectionUser; receiver?: ConnectionUser;
  createdAt: string; updatedAt: string;
};
```

### POST `/request`
- Validation: [`sendConnectionRequestSchema`](src/utils/schema.ts)
- Request body (TypeScript):
  ```ts
  export type SendConnectionRequestRequest = SendConnectionRequestBody;
  ```
- Example request:
  ```json
  { "receiverId": 12, "message": "Let’s connect" }
  ```
- Response 201 (TypeScript):
  ```ts
  export type SendConnectionApiResponse = ApiResponse<ConnectionResponse>;
  ```
- Errors: 400 validation/self, 409 pending/connected/blocked, 503 DB unavailable, 500 internal

### PUT `/request/:connectionId/accept`
- Validation: [`connectionIdParamSchema`](src/utils/schema.ts)
- Params: `{ connectionId: number }`
- Request: No body
- Response 200 (TypeScript):
  ```ts
  export type AcceptConnectionApiResponse = ApiResponse<ConnectionResponse>;
  ```
- Errors: 400 validation or business logic, 401 unauthorized

### PUT `/request/:connectionId/decline`
- Params: `{ connectionId: number }`
- Request: No body
- Response 200 (TypeScript):
  ```ts
  export type DeclineConnectionApiResponse = ApiResponse<ConnectionResponse>;
  ```

### POST `/block/:userId`
- Validation: [`userIdParamSchema`](src/utils/schema.ts)
- Params: `{ userId: number }`
- Request: No body
- Response 200:
  ```ts
  export type BlockUserApiResponse = ApiResponse<{ message: string }>;
  ```
- Errors: 400 validation, 401 unauthorized

### DELETE `/block/:userId`
- Params: `{ userId: number }`
- Request: No body
- Response 200:
  ```ts
  export type UnblockUserApiResponse = ApiResponse<{ message: string }>;
  ```

### DELETE `/remove/:userId`
- Params: `{ userId: number }`
- Request: No body
- Response 200:
  ```ts
  export type RemoveConnectionApiResponse = ApiResponse<{ message: string }>;
  ```

### GET `/pending`
- Request: No body
- Response 200:
  ```ts
  export type PendingRequestsApiResponse = ApiResponse<ConnectionResponse[]>;
  ```

### GET `/sent`
- Request: No body
- Response 200:
  ```ts
  export type SentRequestsApiResponse = ApiResponse<ConnectionResponse[]>;
  ```

### GET `/list`
- Request: No body
- Response 200:
  ```ts
  export type ConnectionsListApiResponse = ApiResponse<ConnectionResponse[]>;
  ```

### GET `/blocked`
- Request: No body
- Response 200:
  ```ts
  export type BlockedUsersApiResponse = ApiResponse<ConnectionResponse[]>;
  ```

### GET `/status/:userId`
- Validation: [`userIdParamSchema`](src/utils/schema.ts)
- Params: `{ userId: number }`
- Request: No body
- Response 200:
  ```ts
  export type ConnectionStatusString = 'SELF' | 'BLOCKED' | 'PENDING' | 'CONNECTED' | 'NONE';
  export type ConnectionStatusApiResponse = ApiResponse<{ status: ConnectionStatusString }>;
  ```

### GET `/stats`
- Request: No body
- Response 200:
  ```ts
  export type ConnectionStatsResponse = { totalAcceptedConnections: number; totalPendingConnections: number };
  export type ConnectionStatsApiResponse = ApiResponse<ConnectionStatsResponse>;
  ```

---

## Example Frontend Usage

```ts
// GET profile
const res = await fetch('/api/users/get-profile', { credentials: 'include' });
const json = (await res.json()) as GetProfileApiResponse;
if (!json.success) throw new Error(json.message || json.error || 'Failed');
const profile = json.data;

// Create profile
const createRes = await fetch('/api/users/create-profile', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullName: 'Jane Doe', timezone: 'UTC' } satisfies CreateProfileRequest),
});
const createJson = (await createRes.json()) as CreateProfileApiResponse;
```

---

## Data Types
- [`utils/types.ts`](src/utils/types.ts):
  - [`UserProfileResponse`](src/utils/types.ts)
  - [`ConnectionResponse`](src/utils/types.ts)
  - [`ConnectionStatus`](src/utils/types.ts)
- Schemas: [`utils/schema.ts`](src/utils/schema.ts):
  - [`CreateUserProfileSchema`](src/utils/schema.ts)
  - [`UpdateUserProfileSchema`](src/utils/schema.ts)
  - [`sendConnectionRequestSchema`](src/utils/schema.ts)
  - [`connectionIdParamSchema`](src/utils/schema.ts)
  - [`userIdParamSchema`](src/utils/schema.ts)

## Common Errors
- 401 `{ error: 'Unauthorized' }`
- 400 `{ success:false, message:string, errors?:[{field,message}] }`
- 404 `{ success:false, message:string }`
- 409 `{ success:false, message:string }`
- 500 `{ success:false, message:'Internal server error' }`
- 503 `{ success:false, message:'Database service temporarily unavailable' }`