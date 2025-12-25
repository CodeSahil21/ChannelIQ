# Chat Service - Single Source of Truth

A comprehensive group management and messaging service with REST API and planned real-time WebSocket features.

## Table of Contents
1. [UI/UX & Group Management Workflow](#section-1-uiux--group-management-workflow)
2. [API Reference (REST Only)](#section-2-api-reference-rest-only)
3. [Proposed Real-Time Contract (Future Implementation)](#section-3-proposed-real-time-contract-future-implementation)
4. [Error Handling](#section-4-error-handling)

---

## Section 1: UI/UX & Group Management Workflow

### Page Mapping

Based on the existing Group/Member endpoints, the frontend requires these UI screens:

#### Core Group Management
- **Groups List Page** (`/chat-ui`) - Display user's groups with member counts
- **Create Group Modal** - Form for creating new groups
- **Group Settings Page** - Edit group details (admin only)
- **Group Info Panel** - View group details, members, and statistics

#### Member Management
- **Add Member Search** - Search and invite users to groups
- **Member List View** - Display group members with roles
- **Join Requests Panel** - Manage pending join requests (admin view)
- **Invitations Panel** - View and respond to group invitations

#### Message Features
- **Chat Window** - Main messaging interface
- **Pinned Messages Panel** - View pinned messages (max 4 per group)
- **Announcement Creator** - Create group announcements (admin only)
- **Announcement Feed** - View recent announcements (last 5 days)
- **Poll Creator** - Create interactive polls with multiple options
- **Poll Voting** - Vote on polls with real-time results
- **Poll Management** - Delete polls (creator or admin only)

### User Journeys

#### Creating and Managing Groups
```
1. User clicks 'New Group' → Create Group Modal opens
2. Fill form (name, description, privacy, max members) → API POST /groups/create
3. Group created → User redirected to group chat
4. Admin invites members → Search users → API POST /groups/:id/invite
5. Members receive invitations → API GET /groups/requests/pending
6. Members accept/decline → API PUT /groups/requests/:requestId
```

#### Joining Groups
```
1. User searches public groups → API GET /groups/search?search=term
2. User requests to join → API POST /groups/:id/join
3. Admin receives join request → API GET /groups/requests/pending
4. Admin approves/rejects → API PUT /groups/requests/:requestId
5. User becomes member → Appears in group member list
```

#### Message Management
```
1. Admin pins important message → API POST /groups/:id/messages/:messageId/pin
2. View pinned messages → API GET /groups/:id/messages/pinned
3. Create announcement → API POST /groups/:id/announcements
4. View recent announcements → API GET /groups/:id/announcements
5. Create poll → API POST /groups/:id/polls
6. Vote on poll → API POST /groups/polls/:messageId/vote (Future)
7. View poll results → API GET /groups/polls/:messageId
8. Delete poll → API DELETE /groups/polls/:messageId
9. Unpin message → API DELETE /groups/:id/messages/:messageId/pin
```

### Permission Logic

The frontend should handle Admin vs. Member permissions based on response data:

#### Admin/Co-Admin Only Features
```typescript
const canManageGroup = (userRole: string) => {
  return ['ADMIN', 'CO_ADMIN'].includes(userRole);
};

// Show these buttons only if canManageGroup(currentUser.role)
- "Edit Group" button
- "Remove Member" button  
- "Change Member Role" dropdown
- "Pin/Unpin Message" button (max 4 pinned messages)
- "Create Announcement" button
- "Delete Group" button (ADMIN only)
- "Delete Poll" button (for polls they didn't create)
```

#### Member Permissions
```typescript
const canLeaveGroup = (userRole: string, isCreator: boolean) => {
  // Creator can only leave if they transfer admin or delete group
  return !isCreator || userRole !== 'ADMIN';
};

// All members can:
- View group details and members
- Send messages (when implemented)
- Leave group (with restrictions for creators)
- Update their own notification settings
- Create polls and vote on existing polls
- View announcements and pinned messages
- Delete their own polls
```

#### Role Hierarchy
```typescript
const roleHierarchy = {
  ADMIN: 3,      // Group creator, full permissions
  CO_ADMIN: 2,   // Can manage members, cannot remove other admins
  MEMBER: 1      // Basic messaging permissions
};

// Co-admins cannot remove admins or other co-admins
const canRemoveMember = (currentRole: string, targetRole: string) => {
  return roleHierarchy[currentRole] > roleHierarchy[targetRole];
};
```

---

## Section 2: API Reference (REST Only)

All endpoints are accessed through API Gateway at `http://localhost:4000/api/groups/*`

### Group Management Endpoints

#### POST /api/groups/create
**Description:** Create a new group

**Zod Validation Rules:**
- `name`: string (min 1 char, max 100 chars, required)
- `description`: string (max 500 chars, optional)
- `isPrivate`: boolean (default: false)
- `imageUrl`: string (valid URL, optional)
- `maxMembers`: number (min 2, max 1000, default: 256)

**Request Body:**
```typescript
interface CreateGroupRequest {
  name: string;
  description?: string;
  isPrivate?: boolean;
  imageUrl?: string;
  maxMembers?: number;
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "id": "uuid-string",
    "name": "Engineering Team",
    "description": "Main engineering discussion",
    "imageUrl": null,
    "isPrivate": false,
    "maxMembers": 256,
    "creatorId": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "creator": {
      "id": 1,
      "email": "john@company.com",
      "fullName": "John Doe",
      "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
    },
    "members": [
      {
        "id": "member-uuid",
        "userId": 1,
        "groupId": "uuid-string",
        "role": "ADMIN",
        "isMuted": false,
        "muteUntil": null,
        "joinedAt": "2024-01-01T00:00:00Z",
        "user": {
          "id": 1,
          "email": "john@company.com",
          "fullName": "John Doe",
          "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
        }
      }
    ]
  }
}
```

---

#### GET /api/groups/my-groups
**Description:** Get all groups the authenticated user is a member of

**Success Response (200):**
```json
{
  "success": true,
  "message": "User groups retrieved successfully",
  "data": [
    {
      "id": "member-uuid",
      "userId": 1,
      "groupId": "group-uuid",
      "role": "ADMIN",
      "isMuted": false,
      "muteUntil": null,
      "joinedAt": "2024-01-01T00:00:00Z",
      "group": {
        "id": "group-uuid",
        "name": "Engineering Team",
        "description": "Main engineering discussion",
        "imageUrl": null,
        "isPrivate": false,
        "maxMembers": 256,
        "creatorId": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "_count": {
          "members": 5
        }
      }
    }
  ]
}
```

---

#### GET /api/groups/:groupId
**Description:** Get detailed group information

**Parameters:**
- `groupId`: string (UUID format, required)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "group-uuid",
    "name": "Engineering Team",
    "description": "Main engineering discussion",
    "imageUrl": null,
    "isPrivate": false,
    "maxMembers": 256,
    "creatorId": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "creator": {
      "id": 1,
      "email": "john@company.com",
      "fullName": "John Doe",
      "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
    },
    "_count": {
      "members": 5,
      "messages": 127
    },
    "members": [
      {
        "id": "member-uuid",
        "userId": 1,
        "groupId": "group-uuid",
        "role": "ADMIN",
        "isMuted": false,
        "muteUntil": null,
        "joinedAt": "2024-01-01T00:00:00Z",
        "user": {
          "id": 1,
          "email": "john@company.com",
          "fullName": "John Doe",
          "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
        }
      }
    ]
  }
}
```

---

#### PUT /api/groups/:groupId
**Description:** Update group information (Admin/Co-Admin only)

**Zod Validation Rules:**
- `name`: string (min 1 char, max 100 chars, optional)
- `description`: string (max 500 chars, optional)
- `imageUrl`: string (valid URL, optional)
- `isPrivate`: boolean (optional)
- `maxMembers`: number (min 2, max 1000, must be >= current member count, optional)
- At least one field must be provided

**Request Body:**
```typescript
interface UpdateGroupRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  isPrivate?: boolean;
  maxMembers?: number;
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Group updated successfully",
  "data": {
    "id": "group-uuid",
    "name": "Updated Engineering Team",
    "description": "Updated description",
    "imageUrl": "http://example.com/new-image.jpg",
    "isPrivate": true,
    "maxMembers": 300,
    "creatorId": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

---

#### DELETE /api/groups/:groupId
**Description:** Delete group (Creator only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Group deleted successfully",
  "deletedGroup": {
    "id": "group-uuid",
    "name": "Engineering Team",
    "creatorId": 1
  }
}
```

---

### Group Search & Discovery

#### GET /api/groups/search
**Description:** Search public groups

**Query Parameters:**
- `search`: string (min 2 chars, max 100 chars, required)
- `page`: number (default: 1, min: 1)
- `limit`: number (default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Groups retrieved successfully",
  "data": {
    "groups": [
      {
        "id": "group-uuid",
        "name": "Public Engineering",
        "description": "Open engineering discussions",
        "imageUrl": null,
        "isPrivate": false,
        "maxMembers": 500,
        "creatorId": 2,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "_count": {
          "members": 45
        },
        "creator": {
          "id": 2,
          "email": "jane@company.com",
          "fullName": "Jane Smith",
          "profileUrl": "http://localhost:9000/profile-images/user-2.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### Member Management Endpoints

#### GET /api/groups/:groupId/members
**Description:** Get all group members (Members only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Group members retrieved successfully",
  "data": [
    {
      "id": "member-uuid",
      "userId": 1,
      "groupId": "group-uuid",
      "role": "ADMIN",
      "isMuted": false,
      "muteUntil": null,
      "joinedAt": "2024-01-01T00:00:00Z",
      "user": {
        "id": 1,
        "email": "john@company.com",
        "fullName": "John Doe",
        "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
      }
    }
  ]
}
```

---

#### POST /api/groups/:groupId/invite
**Description:** Invite user to group (Admin/Co-Admin only)

**Zod Validation Rules:**
- `targetUserId`: number (positive integer, required)
- `message`: string (max 200 chars, optional)

**Request Body:**
```typescript
interface InviteUserRequest {
  targetUserId: number;
  message?: string;
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "id": "request-uuid",
    "groupId": "group-uuid",
    "senderId": 1,
    "receiverId": 2,
    "type": "INVITE",
    "status": "PENDING",
    "message": "Join our engineering team!",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

---

#### POST /api/groups/:groupId/join
**Description:** Request to join group

**Zod Validation Rules:**
- `message`: string (max 200 chars, optional)

**Request Body:**
```typescript
interface JoinGroupRequest {
  message?: string;
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Join request sent successfully",
  "data": {
    "id": "request-uuid",
    "groupId": "group-uuid",
    "senderId": 2,
    "receiverId": 1,
    "type": "JOIN_REQUEST",
    "status": "PENDING",
    "message": "I'd like to join this group",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

---

#### DELETE /api/groups/:groupId/members/:userId
**Description:** Remove member from group or leave group

**Parameters:**
- `groupId`: string (UUID format)
- `userId`: number (positive integer)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully",
  "removedMember": {
    "id": "member-uuid",
    "userId": 2,
    "groupId": "group-uuid",
    "role": "MEMBER"
  }
}
```

---

#### PUT /api/groups/:groupId/members/:userId/role
**Description:** Update member role (Admin only)

**Zod Validation Rules:**
- `role`: enum ("ADMIN" | "CO_ADMIN" | "MEMBER", required)

**Request Body:**
```typescript
interface UpdateMemberRoleRequest {
  role: "ADMIN" | "CO_ADMIN" | "MEMBER";
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member role updated successfully",
  "data": {
    "id": "member-uuid",
    "userId": 2,
    "groupId": "group-uuid",
    "role": "CO_ADMIN",
    "joinedAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": 2,
      "email": "jane@company.com",
      "fullName": "Jane Smith",
      "profileUrl": "http://localhost:9000/profile-images/user-2.jpg"
    }
  }
}
```

---

#### PUT /api/groups/:groupId/settings
**Description:** Update member notification settings

**Zod Validation Rules:**
- `isMuted`: boolean (optional)
- `muteUntil`: string (ISO datetime or null, optional)
- At least one field must be provided

**Request Body:**
```typescript
interface UpdateMemberSettingsRequest {
  isMuted?: boolean;
  muteUntil?: string | null;
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member settings updated successfully",
  "data": {
    "id": "member-uuid",
    "userId": 1,
    "groupId": "group-uuid",
    "role": "ADMIN",
    "isMuted": true,
    "muteUntil": "2024-01-02T00:00:00Z",
    "joinedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### Request Management Endpoints

#### GET /api/groups/requests/pending
**Description:** Get pending invitations and join requests

**Success Response (200):**
```json
{
  "success": true,
  "message": "Pending requests retrieved successfully",
  "data": {
    "invites": [
      {
        "id": "request-uuid",
        "groupId": "group-uuid",
        "senderId": 1,
        "receiverId": 2,
        "type": "INVITE",
        "status": "PENDING",
        "message": "Join our team!",
        "createdAt": "2024-01-01T12:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z",
        "sender": {
          "id": 1,
          "email": "john@company.com",
          "fullName": "John Doe",
          "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
        },
        "receiver": {
          "id": 2,
          "email": "jane@company.com",
          "fullName": "Jane Smith",
          "profileUrl": "http://localhost:9000/profile-images/user-2.jpg"
        },
        "group": {
          "id": "group-uuid",
          "name": "Engineering Team",
          "description": "Main engineering discussion",
          "imageUrl": null,
          "isPrivate": false,
          "creatorId": 1
        }
      }
    ],
    "joinRequests": [
      {
        "id": "request-uuid-2",
        "groupId": "group-uuid",
        "senderId": 3,
        "receiverId": 1,
        "type": "JOIN_REQUEST",
        "status": "PENDING",
        "message": "I'd like to join",
        "createdAt": "2024-01-01T13:00:00Z",
        "updatedAt": "2024-01-01T13:00:00Z",
        "sender": {
          "id": 3,
          "email": "bob@company.com",
          "fullName": "Bob Wilson",
          "profileUrl": null
        },
        "receiver": {
          "id": 1,
          "email": "john@company.com",
          "fullName": "John Doe",
          "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
        },
        "group": {
          "id": "group-uuid",
          "name": "Engineering Team",
          "description": "Main engineering discussion",
          "imageUrl": null,
          "isPrivate": false,
          "creatorId": 1
        }
      }
    ]
  }
}
```

---

#### PUT /api/groups/requests/:requestId
**Description:** Accept or reject invitation/join request

**Zod Validation Rules:**
- `status`: enum ("ACCEPTED" | "REJECTED", required)

**Request Body:**
```typescript
interface RespondToRequestRequest {
  status: "ACCEPTED" | "REJECTED";
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Request accepted successfully",
  "data": {
    "request": {
      "id": "request-uuid",
      "groupId": "group-uuid",
      "senderId": 2,
      "receiverId": 1,
      "type": "JOIN_REQUEST",
      "status": "ACCEPTED",
      "message": "I'd like to join",
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:30:00Z"
    },
    "membership": {
      "id": "member-uuid",
      "userId": 2,
      "groupId": "group-uuid",
      "role": "MEMBER",
      "joinedAt": "2024-01-01T12:30:00Z"
    }
  }
}
```

---

### Message Management Endpoints

#### GET /api/groups/:groupId/messages
**Description:** Get paginated messages for a group

**Query Parameters:**
- `limit`: number (default: 50, max: 100)
- `cursor`: string (UUID for pagination, optional)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "message-uuid",
      "content": "Hello everyone!",
      "type": "TEXT",
      "fileUrl": null,
      "replyToId": null,
      "groupId": "group-uuid",
      "senderId": 1,
      "createdAt": "2024-01-01T12:00:00Z",
      "sender": {
        "id": 1,
        "fullName": "John Doe",
        "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
      }
    }
  ],
  "pagination": {
    "hasMore": true,
    "cursor": "next-message-uuid"
  }
}
```

---

#### POST /api/groups/:groupId/messages/:messageId/pin
**Description:** Pin message in group (Admin/Co-Admin only)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Message pinned successfully",
  "data": {
    "id": "pin-uuid",
    "groupId": "group-uuid",
    "messageId": "message-uuid",
    "pinnedById": 1,
    "pinnedAt": "2024-01-01T12:00:00Z",
    "message": {
      "id": "message-uuid",
      "content": "Important announcement",
      "type": "TEXT",
      "senderId": 1,
      "createdAt": "2024-01-01T11:00:00Z"
    }
  }
}
```

---

#### DELETE /api/groups/:groupId/messages/:messageId/pin
**Description:** Unpin message (Admin/Co-Admin only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message unpinned successfully"
}
```

---

#### GET /api/groups/:groupId/messages/pinned
**Description:** Get all pinned messages in group

**Success Response (200):**
```json
{
  "success": true,
  "message": "Pinned messages retrieved successfully",
  "data": [
    {
      "id": "pin-uuid",
      "groupId": "group-uuid",
      "messageId": "message-uuid",
      "pinnedById": 1,
      "pinnedAt": "2024-01-01T12:00:00Z",
      "message": {
        "id": "message-uuid",
        "content": "Important announcement",
        "type": "TEXT",
        "senderId": 1,
        "createdAt": "2024-01-01T11:00:00Z",
        "sender": {
          "id": 1,
          "email": "john@company.com",
          "fullName": "John Doe",
          "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
        }
      },
      "pinnedBy": {
        "id": 1,
        "email": "john@company.com",
        "fullName": "John Doe",
        "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
      }
    }
  ]
}
```

---

#### POST /api/groups/:groupId/announcements
**Description:** Create group announcement (Admin/Co-Admin only)

**Zod Validation Rules:**
- `title`: string (min 1 char, max 100 chars, required)
- `content`: string (min 1 char, max 1000 chars, required)

**Request Body:**
```typescript
interface CreateAnnouncementRequest {
  title: string;
  content: string;
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "id": "message-uuid",
    "groupId": "group-uuid",
    "senderId": 1,
    "type": "ANNOUNCEMENT",
    "content": "Important Update: Please review the new guidelines",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "sender": {
      "id": 1,
      "email": "john@company.com",
      "fullName": "John Doe",
      "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
    },
    "metadata": {
      "title": "Important Update",
      "isAnnouncement": true
    }
  }
}
```

---

#### GET /api/groups/:groupId/announcements
**Description:** Get recent announcements (last 5 days)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Announcements retrieved successfully",
  "data": [
    {
      "id": "message-uuid",
      "groupId": "group-uuid",
      "senderId": 1,
      "type": "ANNOUNCEMENT",
      "content": "Important Update: Please review the new guidelines",
      "createdAt": "2024-01-01T12:00:00Z",
      "sender": {
        "id": 1,
        "email": "john@company.com",
        "fullName": "John Doe",
        "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
      },
      "metadata": {
        "title": "Important Update",
        "isAnnouncement": true
      }
    }
  ]
}
```

---

### Poll Management Endpoints

#### POST /api/groups/:groupId/polls
**Description:** Create poll in group (All members)

**Zod Validation Rules:**
- `question`: string (min 1 char, max 200 chars, required)
- `options`: array of strings (min 2, max 10 options, each max 100 chars)
- `allowMultiple`: boolean (default: false)
- `expiresAt`: string (ISO datetime, optional)

**Request Body:**
```typescript
interface CreatePollRequest {
  question: string;
  options: string[];
  allowMultiple?: boolean;
  expiresAt?: string;
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Poll created successfully",
  "data": {
    "id": "message-uuid",
    "groupId": "group-uuid",
    "senderId": 1,
    "type": "POLL",
    "content": "What should we have for lunch?",
    "createdAt": "2024-01-01T12:00:00Z",
    "sender": {
      "id": 1,
      "email": "john@company.com",
      "fullName": "John Doe",
      "profileUrl": "http://localhost:9000/profile-images/user-1.jpg"
    },
    "poll": {
      "id": "poll-uuid",
      "question": "What should we have for lunch?",
      "allowMultiple": false,
      "expiresAt": "2024-01-02T12:00:00Z",
      "options": [
        {
          "id": "option-uuid-1",
          "text": "Pizza",
          "voteCount": 0,
          "hasVoted": false
        },
        {
          "id": "option-uuid-2",
          "text": "Burgers",
          "voteCount": 0,
          "hasVoted": false
        }
      ]
    }
  }
}
```

---

#### GET /api/groups/polls/:messageId
**Description:** Get poll details with vote status

**Success Response (200):**
```json
{
  "success": true,
  "message": "Poll retrieved successfully",
  "data": {
    "id": "poll-uuid",
    "question": "What should we have for lunch?",
    "allowMultiple": false,
    "expiresAt": "2024-01-02T12:00:00Z",
    "messageId": "message-uuid",
    "options": [
      {
        "id": "option-uuid-1",
        "text": "Pizza",
        "voteCount": 5,
        "hasVoted": true
      },
      {
        "id": "option-uuid-2",
        "text": "Burgers",
        "voteCount": 3,
        "hasVoted": false
      }
    ]
  }
}
```

---

#### DELETE /api/groups/polls/:messageId
**Description:** Delete poll (Creator or Admin only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Poll deleted successfully"
}
```

---

## Section 3: Real-Time WebSocket API (Implemented)

> **✅ FULLY IMPLEMENTED**  
> Real-time messaging via Socket.IO is fully operational. See SOCKET_API.md for complete documentation.

### WebSocket Connection

**Connection URL:** `ws://localhost:3004/ws`

**Authentication:** JWT token via query parameter or header
```javascript
const socket = new WebSocket('ws://localhost:3004/ws?token=jwt_token_here');
```

### Proposed Client Events (Client → Server)

#### Connection Management
```typescript
// Join group room for real-time updates
socket.emit('group.join', {
  groupId: 'uuid-string'
});

// Leave group room
socket.emit('group.leave', {
  groupId: 'uuid-string'
});

// Update user online status
socket.emit('user.status', {
  status: 'online' | 'away' | 'busy' | 'offline'
});
```

#### Message Events
```typescript
// Send message
socket.emit('message.send', {
  groupId: 'uuid-string',
  content: 'Hello everyone!',
  type: 'TEXT' | 'IMAGE' | 'FILE',
  replyToId?: 'message-uuid',
  fileUrl?: 'http://example.com/file.pdf'
});

// Mark message as read
socket.emit('message.read', {
  messageId: 'uuid-string',
  groupId: 'uuid-string'
});

// Start typing indicator
socket.emit('typing.start', {
  groupId: 'uuid-string'
});

// Stop typing indicator
socket.emit('typing.stop', {
  groupId: 'uuid-string'
});

// React to message
socket.emit('message.react', {
  messageId: 'uuid-string',
  emoji: '👍'
});
```

### Proposed Server Events (Server → Client)

#### Group Events
```typescript
// New group created
socket.on('group.created', {
  group: GroupResponse,
  creator: UserBasic
});

// Group updated
socket.on('group.updated', {
  groupId: 'uuid-string',
  changes: UpdateGroupInput,
  updatedBy: UserBasic
});

// Group deleted
socket.on('group.deleted', {
  groupId: 'uuid-string',
  deletedBy: UserBasic
});
```

#### Member Events
```typescript
// Member joined group
socket.on('member.joined', {
  groupId: 'uuid-string',
  member: GroupMemberResponse,
  joinedVia: 'invite' | 'request' | 'direct'
});

// Member left group
socket.on('member.left', {
  groupId: 'uuid-string',
  userId: number,
  user: UserBasic,
  leftVia: 'self' | 'removed'
});

// Member role changed
socket.on('member.role_changed', {
  groupId: 'uuid-string',
  userId: number,
  oldRole: GroupRole,
  newRole: GroupRole,
  changedBy: UserBasic
});

// Member settings updated
socket.on('member.settings_updated', {
  groupId: 'uuid-string',
  userId: number,
  settings: {
    isMuted: boolean,
    muteUntil: string | null
  }
});
```

#### Message Events
```typescript
// New message received
socket.on('message.new', {
  id: 'uuid-string',
  groupId: 'uuid-string',
  content: 'Hello everyone!',
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'ANNOUNCEMENT',
  senderId: number,
  sender: UserBasic,
  replyToId?: 'uuid-string',
  fileUrl?: 'string',
  createdAt: 'ISO-string'
});

// Message updated/edited
socket.on('message.updated', {
  messageId: 'uuid-string',
  groupId: 'uuid-string',
  content: 'Updated content',
  editedAt: 'ISO-string'
});

// Message deleted
socket.on('message.deleted', {
  messageId: 'uuid-string',
  groupId: 'uuid-string',
  deletedBy: UserBasic
});

// Message pinned
socket.on('message.pinned', {
  groupId: 'uuid-string',
  messageId: 'uuid-string',
  pinnedBy: UserBasic,
  pinnedAt: 'ISO-string'
});

// Message unpinned
socket.on('message.unpinned', {
  groupId: 'uuid-string',
  messageId: 'uuid-string',
  unpinnedBy: UserBasic
});

// Message reaction added
socket.on('message.reaction_added', {
  messageId: 'uuid-string',
  groupId: 'uuid-string',
  userId: number,
  user: UserBasic,
  emoji: '👍'
});

// Message read status updated
socket.on('message.read_status', {
  messageId: 'uuid-string',
  groupId: 'uuid-string',
  readBy: UserBasic[],
  readCount: number
});
```

#### Typing Events
```typescript
// User started typing
socket.on('typing.started', {
  groupId: 'uuid-string',
  userId: number,
  user: UserBasic
});

// User stopped typing
socket.on('typing.stopped', {
  groupId: 'uuid-string',
  userId: number,
  user: UserBasic
});
```

#### Request Events
```typescript
// New invitation received
socket.on('request.invitation_received', {
  request: PendingRequestItem
});

// New join request (for admins)
socket.on('request.join_request_received', {
  request: PendingRequestItem
});

// Request status updated
socket.on('request.status_updated', {
  requestId: 'uuid-string',
  status: 'ACCEPTED' | 'REJECTED',
  updatedBy: UserBasic
});
```

#### User Status Events
```typescript
// User online status changed
socket.on('user.status_changed', {
  userId: number,
  status: 'online' | 'away' | 'busy' | 'offline',
  lastSeen?: 'ISO-string'
});

// User joined group room
socket.on('user.joined_room', {
  groupId: 'uuid-string',
  userId: number,
  user: UserBasic
});

// User left group room
socket.on('user.left_room', {
  groupId: 'uuid-string',
  userId: number,
  user: UserBasic
});
```

### Proposed Room Management

```typescript
// Users automatically join rooms for their groups
// Room naming convention: `group:${groupId}`

// When user connects:
// 1. Authenticate user
// 2. Get user's groups from database
// 3. Join all group rooms automatically
// 4. Emit user.status_changed to all rooms

// When user joins new group:
// 1. Join room: `group:${groupId}`
// 2. Emit member.joined to room

// When user leaves group:
// 1. Leave room: `group:${groupId}`
// 2. Emit member.left to room
```

### Proposed Error Events

```typescript
// Authentication failed
socket.on('error.auth_failed', {
  message: 'Invalid or expired token'
});

// Permission denied
socket.on('error.permission_denied', {
  action: 'message.send',
  reason: 'Not a member of this group'
});

// Rate limit exceeded
socket.on('error.rate_limit', {
  action: 'message.send',
  retryAfter: 5000 // milliseconds
});

// Group not found
socket.on('error.group_not_found', {
  groupId: 'uuid-string'
});
```

---

## Section 4: Error Handling

### Master Error Table

| HTTP Status | Error Scenario | API Response | UI Action |
|-------------|----------------|--------------|-----------|
| **400** | Invalid group name (empty) | `"Group name is required"` | Show field validation error |
| **400** | Group name too long | `"Group name must be 100 characters or less"` | Show character count warning |
| **400** | Invalid maxMembers | `"Group must allow at least 2 members"` | Reset field to minimum value |
| **400** | Invalid UUID format | `"Invalid UUID format"` | Show "Group not found" message |
| **401** | Not authenticated | `"Authentication required"` | Redirect to login page |
| **403** | Not group member | `"You are not a member of this group"` | Show "Access denied" modal |
| **403** | Not admin | `"Only admins can update group information"` | Hide admin-only buttons |
| **403** | Cannot remove creator | `"Cannot remove the group creator"` | Disable remove button for creator |
| **403** | Co-admin limitations | `"Co-admins cannot remove admins"` | Filter member list by permissions |
| **404** | Group not found | `"Group not found"` | Show "Group no longer exists" |
| **404** | User not found | `"Target user not found"` | Show "User not found" in search |
| **404** | Request not found | `"Request not found"` | Remove request from UI list |
| **409** | Already member | `"User is already a member of this group"` | Show "Already a member" toast |
| **409** | Pending request exists | `"You already have a pending join request"` | Show "Request pending" status |
| **409** | Group at capacity | `"Group has reached maximum capacity"` | Show "Group full" message |
| **409** | Request already processed | `"This request has already been processed"` | Refresh requests list |
| **409** | Message already pinned | `"Message is already pinned"` | Update pin button state |
| **409** | Max admins reached | `"Maximum of 3 admins allowed per group"` | Disable promote to admin option |
| **409** | Max pinned messages | `"Maximum of 4 messages can be pinned per group"` | Disable pin button when limit reached |
| **409** | Poll validation error | `"Poll must have at least 2 options"` | Show validation error on form |
| **403** | Poll deletion denied | `"Only poll creator or admins can delete polls"` | Hide delete button for non-creators |
| **404** | Poll not found | `"Poll not found"` | Show "Poll no longer exists" message |
| **500** | Server error | `"Internal server error"` | Show "Something went wrong" toast |

### Frontend Error Handling Patterns

#### Form Validation Errors (400)
```typescript
// Handle Zod validation errors
const handleValidationError = (error: ApiError) => {
  if (error.errors) {
    error.errors.forEach(fieldError => {
      setFieldError(fieldError.field, fieldError.message);
    });
  }
};
```

#### Permission Errors (403)
```typescript
// Hide UI elements based on user role
const canEditGroup = (userRole: string) => {
  return ['ADMIN', 'CO_ADMIN'].includes(userRole);
};

// Show appropriate error messages
const handlePermissionError = (action: string) => {
  const messages = {
    'update_group': 'Only admins can edit group settings',
    'remove_member': 'You don\'t have permission to remove members',
    'pin_message': 'Only admins can pin messages'
  };
  showToast(messages[action] || 'Permission denied', 'error');
};
```

#### Conflict Errors (409)
```typescript
// Handle business logic conflicts
const handleConflictError = (error: ApiError) => {
  const conflictMessages = {
    'already_member': 'This user is already in the group',
    'group_full': 'Group has reached its member limit',
    'pending_request': 'A request is already pending'
  };
  
  showToast(error.message, 'warning');
  
  // Update UI state accordingly
  if (error.message.includes('already a member')) {
    refreshMembersList();
  }
};
```

#### Network Errors (502/503)
```typescript
// Handle service unavailable
const handleNetworkError = () => {
  showToast('Service temporarily unavailable. Please try again.', 'error');
  // Implement retry logic
  setTimeout(() => retryLastAction(), 5000);
};
```

### Error Recovery Strategies

#### Optimistic Updates
```typescript
// Update UI immediately, rollback on error
const optimisticMemberRemove = async (memberId: string) => {
  // Remove from UI immediately
  removeMemberFromUI(memberId);
  
  try {
    await api.removeMember(groupId, memberId);
  } catch (error) {
    // Rollback UI change
    addMemberToUI(member);
    handleApiError(error);
  }
};
```

#### Retry Logic
```typescript
// Retry failed requests with exponential backoff
const retryWithBackoff = async (fn: Function, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

#### Cache Invalidation
```typescript
// Invalidate stale data on errors
const handleStaleDataError = () => {
  // Clear cached group data
  queryClient.invalidateQueries(['groups']);
  queryClient.invalidateQueries(['group-members']);
  
  // Refetch current data
  refetchGroupData();
};
```

---

## Production Deployment Notes

### Environment Configuration
- Configure WebSocket URL for production environment
- Set up proper CORS origins for WebSocket connections
- Implement rate limiting for WebSocket events
- Configure Redis for WebSocket session management

### Monitoring & Logging
- Add WebSocket connection metrics
- Log message delivery status
- Monitor typing indicator performance
- Track real-time event latency

### Security Considerations
- Validate all WebSocket events server-side
- Implement message content filtering
- Add rate limiting per user/group
- Secure file upload handling for media messages

### Performance Optimization
- Implement message pagination for chat history
- Add message caching strategy
- Optimize database queries for real-time events
- Consider message queuing for high-traffic groups