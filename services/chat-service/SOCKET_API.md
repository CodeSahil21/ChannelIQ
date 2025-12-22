# Socket.IO API Documentation

## Overview
Real-time chat system using Socket.IO with TypeScript support, JWT authentication, comprehensive security features, automatic group re-joining, and enhanced message status tracking.

## Authentication
- **Method**: JWT token via HTTP cookies
- **Middleware**: `verifySocketAuth` validates token and attaches user to socket
- **User Type**: `SocketUser { id: number, email: string, fullName: string }`
- **Auto-Rejoin**: Users automatically rejoin all their groups on reconnection

## Connection
```javascript
// ✅ CORRECT: Connect through API Gateway (recommended)
const socket = io('http://localhost:4000', {
  withCredentials: true // Required for cookie-based auth
});

// ❌ AVOID: Direct connection bypasses gateway
// const socket = io('http://localhost:3004');
```

> **⚠️ Important**: Always connect to port 4000 (API Gateway) in production. The gateway automatically proxies Socket.IO connections to the chat service using the default `/socket.io/` path.

## Client to Server Events

### Group Management

#### `group:join`
Join a chat group and receive real-time updates.
```javascript
socket.emit('group:join', { groupId: 'uuid' }, (response) => {
  if (response.success) {
    console.log('Joined group successfully');
  } else {
    console.error('Failed to join:', response.error);
  }
});
```
- **Payload**: `{ groupId: string }`
- **Callback**: `SocketResponse`
- **Validation**: Database verification of group membership
- **Security**: Real-time authorization check

#### `group:leave`
Leave a chat group.
```javascript
socket.emit('group:leave', { groupId: 'uuid' });
```
- **Payload**: `{ groupId: string }`
- **No callback**

### Message Operations

#### `message:send`
Send a new message to a group.
```javascript
socket.emit('message:send', {
  groupId: 'uuid',
  type: 'TEXT',
  content: 'Hello world!',
  replyToId: 'optional-message-id', // Optional
  fileUrl: 'https://example.com/file.jpg' // Optional
}, (response) => {
  if (response.success) {
    console.log('Message sent:', response.messageId);
  }
});
```
- **Payload**: `MessageData`
  - `groupId: string` (required)
  - `type: MessageType` (required) - TEXT, IMAGE, VIDEO, FILE, POLL, ANNOUNCEMENT
  - `content?: string` (optional)
  - `fileUrl?: string` (optional)
  - `replyToId?: string` (optional)
- **Callback**: `SocketResponse & { messageId?: string }`
- **Security**: Session-based group membership validation, content sanitization
- **Status Tracking**: Automatically creates MessageStatus for all group members

#### `message:edit`
Edit an existing message.
```javascript
socket.emit('message:edit', {
  messageId: 'uuid',
  content: 'Updated content'
}, (response) => {
  if (response.success) {
    console.log('Message updated');
  }
});
```
- **Payload**: `{ messageId: string, content: string }`
- **Callback**: `SocketResponse`
- **Security**: Message ownership verification, XSS sanitization

#### `message:delete`
Delete a message.
```javascript
socket.emit('message:delete', {
  messageId: 'uuid'
}, (response) => {
  if (response.success) {
    console.log('Message deleted');
  }
});
```
- **Payload**: `{ messageId: string }`
- **Callback**: `SocketResponse`
- **Security**: Message ownership verification

### Reactions

#### `message:reaction:add`
Add emoji reaction to a message.
```javascript
socket.emit('message:reaction:add', {
  messageId: 'uuid',
  emoji: '👍'
}, (response) => {
  if (response.success) {
    console.log('Reaction added');
  }
});
```
- **Payload**: `{ messageId: string, emoji: string }`
- **Callback**: `SocketResponse`
- **Security**: Emoji validation (Unicode only), database group membership verification
- **Authorization**: Real-time database check (no longer relies on session state)

#### `message:reaction:remove`
Remove emoji reaction from a message.
```javascript
socket.emit('message:reaction:remove', {
  messageId: 'uuid',
  emoji: '👍'
}, (response) => {
  if (response.success) {
    console.log('Reaction removed');
  }
});
```
- **Payload**: `{ messageId: string, emoji: string }`
- **Callback**: `SocketResponse`
- **Security**: Database group membership verification

### Poll Operations

#### `poll:vote`
Vote on a poll option.
```javascript
socket.emit('poll:vote', {
  pollId: 'uuid',
  optionId: 'uuid'
}, (response) => {
  if (response.success) {
    console.log('Vote cast successfully');
  } else {
    console.error('Vote failed:', response.error);
  }
});
```
- **Payload**: `{ pollId: string, optionId: string }`
- **Callback**: `SocketResponse`
- **Security**: Database group membership verification
- **Duplicate Prevention**: Prisma unique constraint prevents multiple votes
- **Real-time Updates**: Broadcasts vote count to all group members

### Real-time Features

#### `user:typing`
Indicate typing status in a group.
```javascript
socket.emit('user:typing', {
  groupId: 'uuid',
  isTyping: true
});
```
- **Payload**: `{ groupId: string, isTyping: boolean }`
- **No callback**
- **Security**: Session-based group membership validation

#### `message:read`
Mark message as read.
```javascript
socket.emit('message:read', {
  messageId: 'uuid',
  groupId: 'uuid'
});
```
- **Payload**: `{ messageId: string, groupId: string }`
- **No callback**
- **Status Update**: Updates MessageStatus to READ

#### `message:delivered`
Mark message as delivered.
```javascript
socket.emit('message:delivered', {
  messageId: 'uuid',
  groupId: 'uuid'
});
```
- **Payload**: `{ messageId: string, groupId: string }`
- **No callback**
- **Status Update**: Updates MessageStatus to DELIVERED

---

## Server to Client Events

### Message Events

#### `message:persisted`
Receive new messages in joined groups.
```javascript
socket.on('message:persisted', (message) => {
  console.log('New message:', message);
  // message: MessageWithRelations | SystemMessage
});
```
- **Payload**: `MessageWithRelations | SystemMessage`
- **Includes**: Full message data with sender info, reactions, statuses
- **Enhanced**: Now includes MessageStatus for all group members

#### `message:updated`
Receive message edit/delete notifications.
```javascript
socket.on('message:updated', (data) => {
  if (data.isDeleted) {
    console.log('Message deleted:', data.messageId);
  } else {
    console.log('Message edited:', data.messageId, data.content);
  }
});
```
- **Payload**: `{ messageId: string, content?: string, isDeleted: boolean, updatedAt: Date }`

#### `message:read`
Receive read receipts.
```javascript
socket.on('message:read', (data) => {
  console.log(`User ${data.userId} read message ${data.messageId}`);
});
```
- **Payload**: `{ messageId: string, userId: number }`

#### `message:delivered`
Receive delivery receipts.
```javascript
socket.on('message:delivered', (data) => {
  console.log(`Message ${data.messageId} delivered to user ${data.userId}`);
});
```
- **Payload**: `{ messageId: string, userId: number }`

### Reaction Events

#### `reaction:updated`
Receive reaction updates.
```javascript
socket.on('reaction:updated', (data) => {
  console.log(`User ${data.userId} ${data.action}ed ${data.emoji} to message ${data.messageId}`);
});
```
- **Payload**: `{ messageId: string, emoji: string, userId: number, action: "add" | "remove" }`

### Poll Events

#### `poll:vote:update`
Receive poll vote updates.
```javascript
socket.on('poll:vote:update', (data) => {
  console.log(`Poll ${data.pollId} option ${data.optionId} now has ${data.voteCount} votes`);
  console.log(`Vote by user ${data.userId}`);
});
```
- **Payload**: `{ pollId: string, optionId: string, userId: number, voteCount: number }`
- **Real-time**: Broadcasts immediately after vote is cast

### Real-time Events

#### `typing:updated`
Receive typing indicators.
```javascript
socket.on('typing:updated', (data) => {
  if (data.isTyping) {
    console.log(`${data.fullName} is typing in group ${data.groupId}`);
  } else {
    console.log(`${data.fullName} stopped typing`);
  }
});
```
- **Payload**: `{ groupId: string, userId: number, isTyping: boolean, fullName: string }`

#### `user:status`
Receive user online/offline status.
```javascript
socket.on('user:status', (data) => {
  console.log(`User ${data.userId} is ${data.status}`);
  if (data.lastSeen) {
    console.log('Last seen:', data.lastSeen);
  }
});
```
- **Payload**: `{ userId: number, status: "online" | "offline", lastSeen?: Date }`

### Group Management Events

#### `group:member:added`
Receive notifications when members join.
```javascript
socket.on('group:member:added', (data) => {
  console.log(`${data.fullName} joined group ${data.groupId} as ${data.role}`);
});
```
- **Payload**: `{ groupId: string, userId: number, fullName: string, role: GroupRole }`

#### `group:member:removed`
Receive notifications when members leave.
```javascript
socket.on('group:member:removed', (data) => {
  console.log(`${data.fullName} left group ${data.groupId}`);
});
```
- **Payload**: `{ groupId: string, userId: number, fullName: string }`

#### `group:member:role:updated`
Receive role change notifications.
```javascript
socket.on('group:member:role:updated', (data) => {
  console.log(`${data.fullName} role changed to ${data.newRole} in group ${data.groupId}`);
});
```
- **Payload**: `{ groupId: string, userId: number, fullName: string, newRole: GroupRole }`

#### `system:message`
Receive system announcements.
```javascript
socket.on('system:message', (data) => {
  console.log('System message:', data.content);
});
```
- **Payload**: `{ content: string, groupId: string, createdAt: Date }`

---

## Data Types

### MessageType Enum
```typescript
enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE', 
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  POLL = 'POLL',
  ANNOUNCEMENT = 'ANNOUNCEMENT'
}
```

### GroupRole Enum
```typescript
enum GroupRole {
  ADMIN = 'ADMIN',
  CO_ADMIN = 'CO_ADMIN', 
  MEMBER = 'MEMBER'
}
```

### DeliveryStatus Enum
```typescript
enum DeliveryStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'read'
}
```

### SocketResponse
```typescript
interface SocketResponse {
  success: boolean;
  error?: string;
  messageId?: string; // For message operations
}
```

---

## Enhanced Features

### Automatic Group Re-joining
- Users automatically rejoin all their groups on reconnection
- Database-driven group membership fetching
- Session state synchronization
- No manual re-joining required

### Enhanced Message Status Tracking
- **Sender**: Gets `SENT` status immediately
- **All other group members**: Get `DELIVERED` status automatically
- **Real-time updates**: Status changes broadcast to group
- **Atomic operations**: Message creation and status initialization in single transaction

### Database-Driven Authorization
- **Reactions**: Real-time database verification (no stale session state)
- **Poll voting**: Group membership verified before vote
- **Message operations**: Ownership and membership checks
- **Consistent security**: All operations use fresh database state

---

## Security Features

### Input Validation
- All required fields validated before processing
- Content sanitized to prevent XSS attacks
- Emoji validation using Unicode regex
- Poll ID and option ID validation

### Authorization
- **Auto-rejoin**: Database verification on connection
- **Real-time checks**: Database verification for reactions and polls
- **Session validation**: Memory-based checks for frequent operations
- **Message ownership**: Verification for edit/delete operations

### Content Security
- HTML encoding for all user content
- Emoji whitelist validation
- File URL validation
- Duplicate vote prevention

---

## Error Handling

### Common Error Responses
```javascript
{
  success: false,
  error: "Must join group first"
}

{
  success: false, 
  error: "Missing required fields"
}

{
  success: false,
  error: "Invalid emoji format"
}

{
  success: false,
  error: "Message not found"
}

{
  success: false,
  error: "Poll not found"
}

{
  success: false,
  error: "Not a group member"
}
```

### Connection Errors
- `"No cookies"` - Missing authentication
- `"No token"` - Missing JWT token
- `"Unauthorized"` - Invalid token
- `"User not found"` - User doesn't exist
- `"Failed to rejoin groups"` - Database error during auto-rejoin

---

## Best Practices

### Client Implementation
1. Always handle callback responses
2. Implement reconnection logic
3. Validate data before emitting
4. Handle connection state changes
5. Listen for poll vote updates

### Performance
- Auto-rejoin eliminates manual group joining
- Database checks are optimized with indexes
- Session state used for frequent operations
- Message status tracking is atomic

### Security
- Never trust client data
- All operations use database verification
- Use HTTPS in production
- Implement rate limiting
- Monitor for duplicate vote attempts