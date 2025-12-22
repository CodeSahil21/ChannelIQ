# Socket.IO API Documentation

## Overview
Real-time chat system using Socket.IO with TypeScript support, JWT authentication, and comprehensive security features.

## Authentication
- **Method**: JWT token via HTTP cookies
- **Middleware**: `verifySocketAuth` validates token and attaches user to socket
- **User Type**: `SocketUser { id: number, email: string, fullName: string }`

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
- **Validation**: Verifies user is group member
- **Security**: Database verification before joining

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
- **Security**: Group membership validation, content sanitization

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
- **Security**: Emoji validation (Unicode only), group membership check

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
- **Security**: Group membership validation

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
  MODERATOR = 'MODERATOR', 
  MEMBER = 'MEMBER'
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

## Security Features

### Input Validation
- All required fields validated before processing
- Content sanitized to prevent XSS attacks
- Emoji validation using Unicode regex

### Authorization
- Group membership verified on join
- Session-based validation for real-time events
- Message ownership verification for edit/delete

### Content Security
- HTML encoding for all user content
- Emoji whitelist validation
- File URL validation

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
```

### Connection Errors
- `"No cookies"` - Missing authentication
- `"No token"` - Missing JWT token
- `"Unauthorized"` - Invalid token
- `"User not found"` - User doesn't exist

---

## Best Practices

### Client Implementation
1. Always handle callback responses
2. Implement reconnection logic
3. Validate data before emitting
4. Handle connection state changes

### Performance
- Join only necessary groups
- Implement message pagination
- Use typing indicators sparingly
- Cache user data locally

### Security
- Never trust client data
- Validate all inputs server-side
- Use HTTPS in production
- Implement rate limiting