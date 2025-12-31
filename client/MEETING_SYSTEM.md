# CorporateChat Meeting System Frontend

## Overview

This is a complete frontend implementation for the CorporateChat Meeting System, built with React 19, TypeScript, Redux Toolkit, and LiveKit React Components SDK. The system provides enterprise-grade video conferencing with role-based access control and secure authentication.

## Architecture

### Tech Stack
- **React 19** - Modern React with concurrent features
- **TypeScript** - Strict type safety
- **Redux Toolkit** - State management with async thunks
- **Axios** - HTTP client with interceptors
- **LiveKit React Components SDK** - Video/audio conferencing
- **Vanilla CSS** - Custom styling with CSS variables

### Security Features
- **JWT Authentication** - HTTP-only cookies only
- **Role-Based UI** - HOST, CO_HOST, PARTICIPANT permissions
- **No Client Secrets** - LiveKit tokens fetched from backend
- **Memory-Only Tokens** - No localStorage/sessionStorage

## File Structure

```
src/
├── api/
│   └── meeting.api.ts              # Meeting service API client
├── components/
│   └── meetings/
│       ├── MeetingHero.tsx         # Meeting title & status display
│       ├── MeetingJoinCard.tsx     # Join meeting interface
│       ├── MeetingControls.tsx     # Host/co-host controls
│       ├── MeetingParticipants.tsx # Participant management
│       └── LiveKitRoom.tsx         # Video conference room
├── pages/
│   ├── Meeting.tsx                 # Main meeting page (/meeting/:id)
│   └── MeetingDemo.tsx            # Demo & testing page
├── store/
│   └── meetingSlice.ts            # Redux state management
└── types/
    └── meeting.types.ts           # TypeScript definitions
```

## Features Implemented

### ✅ Core Meeting Management
- Create meetings with title, description, scheduled time
- Search meetings by ID
- Join meetings with invite tokens
- Password-protected meetings
- Meeting lifecycle (SCHEDULED → LIVE → ENDED)

### ✅ Role-Based Access Control
- **HOST**: Full control (start, end, promote, demote, password)
- **CO_HOST**: Limited admin (start, moderate)
- **PARTICIPANT**: Join and media only

### ✅ LiveKit Integration
- High-quality video/audio conferencing
- Screen sharing (HOST/CO_HOST only)
- In-meeting chat
- Participant management
- Device controls (camera, microphone, speaker)
- Network quality indicators
- Automatic reconnection

### ✅ Security & Authentication
- JWT-based authentication via HTTP-only cookies
- LiveKit tokens fetched securely from backend
- No sensitive data in frontend storage
- Rate limiting with cooldown UI (429 errors)
- Input validation and error handling

### ✅ User Experience
- Responsive design (desktop & mobile)
- Loading states and skeleton loaders
- Error boundaries and graceful failures
- Real-time participant updates
- Accessibility support (WCAG 2.1)
- Dark/light theme support

## API Integration

### Meeting Service Endpoints
```typescript
// Create meeting
POST /api/meetings
{
  title: string;
  description?: string;
  scheduledAt: string;
}

// Search meeting
GET /api/meetings/search/{meetingId}

// Join meeting
POST /api/meetings/{id}/join
{
  inviteToken: string;
  password?: string;
}

// Get LiveKit token
GET /api/meetings/{id}/livekit-token

// Meeting controls (HOST/CO_HOST only)
POST /api/meetings/{id}/start
POST /api/meetings/{id}/end
PUT /api/meetings/{id}/password
DELETE /api/meetings/{id}/password
POST /api/meetings/{id}/promote
POST /api/meetings/{id}/demote
```

### Error Handling
- **400**: Validation errors with field-specific messages
- **401**: Authentication required → redirect to login
- **403**: Insufficient permissions → role-based UI
- **404**: Meeting not found → user-friendly message
- **429**: Rate limiting → cooldown timer UI
- **500**: Server errors → retry mechanisms

## Usage Examples

### Basic Meeting Flow
```typescript
// 1. Create a meeting
const meeting = await dispatch(createMeeting({
  title: "Team Standup",
  description: "Daily sync meeting",
  scheduledAt: "2024-01-15T10:00:00Z"
})).unwrap();

// 2. Navigate to meeting page
navigate(`/meeting/${meeting.id}`);

// 3. Join with invite token
await dispatch(joinMeeting({
  meetingId: meeting.id,
  data: { inviteToken: "abc123", password: "optional" }
}));

// 4. Start meeting (HOST only)
await dispatch(startMeeting(meeting.id));
```

### LiveKit Integration
```tsx
<LiveKitRoom meeting={meeting} userRole={userRole}>
  <VideoConference />
  <ControlBar controls={{
    camera: true,
    microphone: true,
    screenShare: userRole === 'HOST' || userRole === 'CO_HOST',
    chat: true
  }} />
  <Chat />
</LiveKitRoom>
```

## Component Usage

### Meeting Page
```tsx
// Single route handles all meeting functionality
<Route path="/meeting/:meetingId" element={<Meeting />} />
```

### Meeting Components
```tsx
// Hero section - meeting info & status
<MeetingHero meeting={meeting} loading={loading} />

// Join interface with rate limiting
<MeetingJoinCard 
  meeting={meeting} 
  joinLoading={joinLoading}
  error={error}
  userRole={userRole} 
/>

// Host controls (conditional rendering)
{userRole && (
  <MeetingControls 
    meeting={meeting}
    userRole={userRole}
    error={error}
  />
)}

// Participant management
<MeetingParticipants
  meetingId={meeting?.id}
  participants={participants}
  userRole={userRole}
  error={error}
/>

// Video conference room
<LiveKitRoom meeting={meeting} userRole={userRole} />
```

## State Management

### Redux Store Structure
```typescript
interface MeetingState {
  currentMeeting: Meeting | null;
  participants: MeetingParticipant[];
  userRole: ParticipantRole | null;
  loading: boolean;
  error: string | null;
  joinLoading: boolean;
  tokenLoading: boolean;
  liveKitReady: boolean;
}
```

### Async Actions
- `createMeeting` - Create new meeting
- `searchMeeting` - Find meeting by ID
- `joinMeeting` - Join with invite token
- `getLiveKitToken` - Fetch video conference token
- `startMeeting` - Start meeting (HOST/CO_HOST)
- `endMeeting` - End meeting (HOST only)
- `setPassword` / `removePassword` - Password management
- `promoteCoHost` / `demoteCoHost` - Role management
- `fetchParticipants` - Get participant list

## Styling

### CSS Architecture
- CSS variables for theming
- Component-scoped styles
- Responsive design with mobile-first approach
- Dark/light theme support
- Accessibility-focused (focus states, high contrast)

### Key CSS Classes
```css
.meeting-page                    /* Main page container */
.meeting-hero                    /* Meeting title & status */
.meeting-join-card              /* Join interface */
.meeting-controls               /* Host controls */
.meeting-participants           /* Participant list */
.livekit-room                   /* Video conference */
.participant-item               /* Individual participant */
.meeting-status--live           /* Live meeting indicator */
```

## Testing & Demo

### Demo Page
Visit `/meetings` for a demonstration interface that allows:
- Creating test meetings
- Joining existing meetings by ID
- Feature overview and instructions

### Manual Testing
1. Create a meeting from demo page
2. Copy meeting ID and open in new tab/browser
3. Join with invite token
4. Test role-based features
5. Verify video/audio functionality

## Performance Optimizations

### Code Splitting
- Lazy-loaded meeting components
- Dynamic imports for heavy dependencies
- Route-level code splitting

### LiveKit Optimizations
- Token caching in memory only
- Automatic quality adaptation
- Efficient participant rendering
- Connection pooling and reconnection

### Bundle Size
- Tree-shaking for unused code
- Optimized LiveKit component imports
- Minimal CSS footprint
- Compressed assets

## Browser Support

### Minimum Requirements
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### WebRTC Features
- Camera/microphone access
- Screen sharing
- Real-time communication
- Network quality detection

## Deployment

### Build Process
```bash
npm run build
```

### Environment Variables
```env
VITE_API_BASE_URL=https://api.corporatechat.com
VITE_SOCKET_URL=https://api.corporatechat.com
```

### Static Hosting
Compatible with:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

## Security Considerations

### Frontend Security
- No API keys or secrets exposed
- JWT tokens in HTTP-only cookies only
- Input sanitization and validation
- XSS protection via React
- CSRF protection via SameSite cookies

### Meeting Security
- Invite token validation
- Password protection support
- Role-based permission enforcement
- Rate limiting with user feedback
- Secure token exchange with backend

## Future Enhancements

### Planned Features
- Meeting recordings
- Breakout rooms
- Virtual backgrounds
- Meeting analytics
- Mobile app (React Native)

### Performance Improvements
- Virtual scrolling for large participant lists
- WebAssembly for video processing
- Service worker for offline support
- Advanced caching strategies

## Troubleshooting

### Common Issues
1. **LiveKit connection fails**: Check token expiration and network
2. **Camera/mic not working**: Verify browser permissions
3. **Meeting not found**: Validate meeting ID and user access
4. **Rate limiting**: Wait for cooldown period to expire

### Debug Mode
Enable debug logging:
```typescript
// In development
localStorage.setItem('livekit-debug', 'true');
```

## Contributing

### Development Setup
```bash
npm install
npm run dev
```

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Component-based architecture
- Comprehensive error handling
- Accessibility compliance

---

This implementation provides a complete, production-ready meeting system frontend that integrates seamlessly with the CorporateChat backend architecture while leveraging LiveKit's powerful video conferencing capabilities.