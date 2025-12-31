# Meeting Service Socket.IO Implementation

## Overview
Real-time participant updates for meetings using Socket.IO with Redis pub/sub, following the same pattern as chat-service.

## Features
- Real-time participant join/leave notifications
- Role promotion/demotion updates
- Meeting start/end events
- Cross-instance communication via Redis pub/sub
- Authentication middleware
- Room-based event broadcasting

## Socket Events

### Client to Server
- `joinMeetingRoom(meetingId)` - Join a meeting room for updates
- `leaveMeetingRoom(meetingId)` - Leave a meeting room

### Server to Client
- `participantJoined` - User joined the meeting
- `participantLeft` - User left the meeting  
- `participantRoleChanged` - User role was promoted/demoted
- `meetingStarted` - Meeting was started by host
- `meetingEnded` - Meeting was ended by host

## Usage

### Backend Integration
Socket events are automatically emitted when:
- User joins meeting via REST API
- User leaves meeting via REST API
- Host promotes/demotes participants via REST API
- Host starts/ends meeting via REST API

### Frontend Integration
```typescript
import { useMeetingSocket } from '../hooks/useMeetingSocket';

// In your component
const socket = useMeetingSocket(meetingId, authToken);
```

## Configuration
- Socket.IO server runs on same port as meeting-service HTTP server
- Path: `/meeting-socket/`
- Authentication via JWT token
- Redis pub/sub for cross-instance communication

## Environment Variables
```
FRONTEND_URLS=http://localhost:3000,http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```