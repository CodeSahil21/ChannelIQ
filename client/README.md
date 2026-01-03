# CorporateChat Frontend

Enterprise-grade React application for corporate communication and collaboration. Built with modern TypeScript, Redux Toolkit, Socket.IO for real-time messaging, and LiveKit for video conferencing.

## Project Overview

CorporateChat Frontend is a comprehensive web application designed for corporate teams to communicate, collaborate, and manage professional relationships. The application provides secure authentication, profile management, connection networking, group chat functionality, real-time messaging, and integrated video meetings.

**Target Users:**
- Corporate employees and teams
- HR departments managing employee connections
- Project managers coordinating team communication
- Executives requiring secure corporate messaging

**Key Problems Solved:**
- Fragmented corporate communication across multiple platforms
- Lack of professional networking within organizations
- Inefficient team collaboration and project coordination
- Security concerns with external messaging platforms
- Need for integrated video conferencing solutions

**System Integration:**
The frontend communicates with a microservices backend architecture through an API Gateway, ensuring scalable, secure, and maintainable enterprise-grade communication.

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | 19.2.0 | Component-based UI library |
| **Language** | TypeScript | 5.9.3 | Type safety and developer experience |
| **Build Tool** | Vite | 7.2.4 | Fast development and optimized builds |
| **State Management** | Redux Toolkit | 2.11.0 | Predictable state container |
| **Routing** | React Router DOM | 7.10.1 | Client-side routing and navigation |
| **HTTP Client** | Axios | 1.13.2 | API communication with interceptors |
| **Real-time** | Socket.IO Client | 4.8.1 | WebSocket-based real-time features |
| **Video Conferencing** | LiveKit | 2.16.1 | WebRTC-based video meetings |
| **LiveKit Components** | @livekit/components-react | 2.9.17 | Pre-built video UI components |
| **Styling** | Vanilla CSS | - | Custom CSS with CSS variables |
| **Animations** | Framer Motion | 12.23.25 | Smooth UI animations and transitions |
| **Icons** | React Icons | 5.5.0 | Comprehensive icon library |
| **Notifications** | React Hot Toast | 2.6.0 | Toast notification system |
| **Linting** | ESLint | 9.39.1 | Code quality and consistency |
| **Type Checking** | TypeScript ESLint | 8.46.4 | TypeScript-specific linting rules |

## High-Level Frontend Architecture

### Application Structure
The application follows a **feature-based architecture** with clear separation of concerns:

```
Authentication Layer → Route Protection → Feature Modules → UI Components
```

### Core Architecture Principles

**1. Feature-Based Organization**
- Components grouped by business domain (Chat, Connections, Profile)
- Shared UI components in dedicated directory
- Domain-specific hooks and utilities

**2. Centralized State Management**
- Redux Toolkit for global application state
- Feature-specific slices for modular state management
- Async thunks for API integration with loading/error states

**3. API Abstraction Layer**
- Service-specific API clients with consistent interfaces
- Request/response interceptors for authentication and caching
- Type-safe API contracts with TypeScript interfaces

**4. Authentication Guards**
- Higher-order component pattern for route protection
- JWT token validation with automatic refresh
- Graceful authentication failure handling

**5. Real-time Integration**
- Socket.IO client with connection lifecycle management
- Event-driven architecture for live updates
- Optimistic UI updates with server reconciliation

## Folder Structure

```
src/
├── api/                    # API client configurations
│   ├── connection.api.ts   # Connection management endpoints
│   ├── groupContent.api.ts # Group content and messaging
│   ├── media.api.ts        # File upload and media handling
│   ├── meeting.api.ts      # Video meeting management
│   └── user.api.ts         # User profile and search
├── components/             # Reusable UI components
│   ├── Chat/              # Real-time messaging components
│   │   ├── ChatProvider.tsx        # Socket.IO context provider
│   │   ├── ChatMessages.tsx        # Message rendering container
│   │   ├── MessageList.tsx         # Message list with virtualization
│   │   ├── MessageItem.tsx         # Individual message component
│   │   ├── MessageInput.tsx        # Message composition with file upload
│   │   ├── GroupDetailView.tsx     # Group management interface
│   │   ├── GroupProfile.tsx        # Group information display
│   │   ├── GroupCards.tsx          # Group list cards
│   │   ├── CreateGroupModal.tsx    # Group creation interface
│   │   ├── UpdateGroupModal.tsx    # Group editing interface
│   │   ├── DeleteGroupModal.tsx    # Group deletion confirmation
│   │   ├── AddMembersModal.tsx     # Member invitation interface
│   │   ├── RemoveMemberModal.tsx   # Member removal confirmation
│   │   ├── LeaveGroupModal.tsx     # Group leave confirmation
│   │   ├── MemberActionDropdown.tsx # Member management actions
│   │   ├── SearchGroupModal.tsx    # Group search interface
│   │   ├── PollsListModal.tsx      # Group polls management
│   │   ├── CreatePollModal.tsx     # Poll creation interface
│   │   ├── AnnouncementsListModal.tsx # Group announcements
│   │   ├── CreateAnnouncementModal.tsx # Announcement creation
│   │   ├── PinnedMessagesModal.tsx # Pinned messages display
│   │   ├── FileUpload.tsx          # File upload component
│   │   ├── TypingIndicator.tsx     # Real-time typing status
│   │   └── GroupActions.tsx        # Group action buttons
│   ├── connections/       # Professional networking features
│   │   ├── ConnectionsList.tsx     # User connections management
│   │   ├── PendingRequests.tsx     # Connection request handling
│   │   ├── SentRequests.tsx        # Sent connection requests
│   │   ├── BlockedUsers.tsx        # Blocked users management
│   │   ├── ConnectionCard.tsx      # Individual connection display
│   │   ├── ConnectionButton.tsx    # Connection action button
│   │   ├── ConnectionStats.tsx     # Network analytics
│   │   ├── SendRequestModal.tsx    # Connection request interface
│   │   └── ConnectionNotificationBadge.tsx # Request notifications
│   ├── forms/             # Authentication and data entry forms
│   │   ├── LoginForm.tsx           # User authentication
│   │   ├── RegisterForm.tsx        # Account creation
│   │   ├── ForgotPasswordForm.tsx  # Password recovery
│   │   ├── ResetPasswordForm.tsx   # Password reset
│   │   └── VerifyOtpForm.tsx       # OTP verification
│   ├── layout/            # Application shell components
│   │   ├── Layout.tsx              # Main application wrapper
│   │   ├── Navbar.tsx              # Navigation header
│   │   └── Sidebar.tsx             # Navigation sidebar
│   ├── meetings/          # Video conferencing components
│   │   ├── CreateMeetingModal.tsx  # Meeting creation interface
│   │   ├── JoinMeetingModal.tsx    # Meeting join interface
│   │   ├── MeetingDetailsModal.tsx # Meeting information display
│   │   ├── LiveKitRoom.tsx         # LiveKit room wrapper
│   │   ├── MeetingControls.tsx     # Meeting control buttons
│   │   ├── MeetingParticipants.tsx # Participant management
│   │   ├── MeetingHero.tsx         # Meeting landing section
│   │   ├── MeetingJoinCard.tsx     # Meeting join card
│   │   └── RemoveParticipantModal.tsx # Participant removal
│   ├── profile/           # User profile management
│   │   ├── ProfileView.tsx         # Profile display
│   │   ├── EditProfile.tsx         # Profile editing
│   │   ├── CreateProfile.tsx       # Initial profile setup
│   │   ├── PreferencesView.tsx     # User preferences
│   │   ├── ProfileImageModal.tsx   # Profile image upload
│   │   └── DeleteProfileModal.tsx  # Profile deletion
│   ├── search/            # User discovery and search
│   │   ├── SearchModal.tsx         # User search interface
│   │   └── UserProfileModal.tsx    # User profile preview
│   └── ui/                # Reusable UI primitives
│       ├── Button.tsx              # Styled button component
│       ├── Input.tsx               # Form input component
│       ├── PasswordInput.tsx       # Password input with visibility toggle
│       ├── Loader.tsx              # Loading indicators
│       ├── ErrorBoundary.tsx       # Error handling wrapper
│       ├── PageTransition.tsx      # Page transition animations
│       └── PresignedImage.tsx      # Secure image display
├── hooks/                 # Custom React hooks
│   ├── useAppDispatch.ts  # Typed Redux dispatch hook
│   ├── useSocket.ts       # Socket.IO connection management
│   ├── useMeetingSocket.ts # Meeting-specific socket events
│   ├── useConnections.ts  # Connection management logic
│   ├── useProfile.ts      # Profile management logic
│   ├── useGroups.ts       # Group management logic
│   ├── useFileUpload.ts   # File upload handling
│   └── useUserSearch.ts   # User search functionality
├── pages/                 # Route-level page components
│   ├── Home.tsx           # Landing page
│   ├── Login.tsx          # Authentication page
│   ├── Register.tsx       # User registration
│   ├── ForgotPassword.tsx # Password recovery
│   ├── ResetPassword.tsx  # Password reset
│   ├── VerifyOtp.tsx      # OTP verification
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Profile.tsx        # User profile page
│   ├── Preferences.tsx    # User preferences
│   ├── Connections.tsx    # Professional networking
│   ├── ChatPage.tsx       # Real-time messaging
│   ├── Meeting.tsx        # Video meeting page
│   └── MeetingDemo.tsx    # Meeting demo/test page
├── store/                 # Redux Toolkit configuration
│   ├── index.ts           # Store configuration
│   ├── userSlice.ts       # User authentication state
│   ├── themeSlice.ts      # Theme and preferences
│   ├── connectionSlice.ts # Professional connections
│   ├── groupSlice.ts      # Group management
│   ├── groupContentSlice.ts # Group content and polls
│   ├── messagesSlice.ts   # Real-time messaging state
│   ├── mediaSlice.ts      # File upload and media
│   ├── meetingSlice.ts    # Video meeting state
│   └── profileSlice.ts    # Profile management
├── types/                 # TypeScript type definitions
│   ├── index.ts           # Common types and interfaces
│   ├── connection.types.ts # Connection-related types
│   ├── group.types.ts     # Group and messaging types
│   ├── groupContent.types.ts # Group content types
│   ├── meeting.types.ts   # Video meeting types
│   └── user.types.ts      # User profile types
├── utils/                 # Utility functions and helpers
│   └── apiCache.ts        # Client-side API response caching
├── App.tsx                # Root application component
├── main.tsx               # Application entry point
└── index.css              # Global styles and CSS variables
```

### Directory Explanations

- **api/**: Service-specific API clients with consistent error handling and type safety
- **components/**: Feature-organized components with clear domain boundaries
  - **Chat/**: Comprehensive messaging system with group management, polls, announcements
  - **connections/**: Professional networking with connection requests and management
  - **forms/**: Authentication forms with OTP verification and password recovery
  - **layout/**: Application shell with navigation and responsive design
  - **meetings/**: Video conferencing integration with LiveKit components
  - **profile/**: User profile management with image upload and preferences
  - **search/**: User discovery and profile preview functionality
  - **ui/**: Reusable UI primitives and utility components
- **hooks/**: Custom hooks encapsulating complex logic and state management
- **pages/**: Route-level components representing application screens
- **store/**: Redux Toolkit slices with async thunks for API integration
- **types/**: Comprehensive TypeScript definitions for type safety
- **utils/**: Pure utility functions and helper classes

## Authentication & Authorization Flow

### Authentication Architecture
The application implements a **cookie-based JWT authentication** system with automatic token refresh and secure session management.

### Login Flow
```
1. User submits credentials → LoginForm
2. API call to /api/auth/login → Backend validation
3. JWT token set in HTTP-only cookie → Secure storage
4. User state updated in Redux → Global authentication state
5. Redirect to protected route → Route guard validation
```

### Route Protection
```typescript
// UserProtectWrapper.tsx - Higher-order component pattern
const UserProtectWrapper = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Validate authentication on mount
    fetchUserProfile();
  }, []);
  
  // Render children only if authenticated
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

### Token Management
- **Storage**: HTTP-only cookies for XSS protection
- **Validation**: Automatic profile fetch on application load
- **Refresh**: Transparent token renewal on API calls
- **Expiration**: Graceful logout with redirect to login

### Role-Based UI Rendering
```typescript
// Conditional rendering based on user permissions
{user.role === 'ADMIN' && <AdminPanel />}
{hasPermission('CREATE_GROUP') && <CreateGroupButton />}
```

## API Integration

### Centralized API Architecture
Each backend service has a dedicated API client with consistent patterns:

```typescript
// connection.api.ts - Service-specific client
const api = axios.create({
  baseURL: 'http://localhost:4000/api/connections',
  withCredentials: true,
  timeout: 10000
});

// Request interceptor for caching
api.interceptors.request.use((config) => {
  // Client-side caching logic
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => handleApiError(error)
);
```

### API Client Features
- **Type Safety**: Full TypeScript integration with request/response types
- **Error Handling**: Centralized error processing with user-friendly messages
- **Caching**: Intelligent client-side caching with TTL expiration
- **Authentication**: Automatic cookie-based authentication headers
- **Timeout Management**: Configurable request timeouts per service

### Environment-Based Configuration
```typescript
// API base URLs configured per environment
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.channeliQ.com'
  : 'http://localhost:4000';
```

### Retry & Error Strategy
- **Network Errors**: Automatic retry with exponential backoff
- **Authentication Errors**: Redirect to login with state preservation
- **Validation Errors**: Field-level error display with form integration
- **Server Errors**: User-friendly error messages with support contact

## State Management

### Redux Toolkit Architecture
The application uses **Redux Toolkit** for predictable state management with the following principles:

**Why Redux Toolkit:**
- **Predictable State**: Single source of truth for application state
- **DevTools Integration**: Time-travel debugging and state inspection
- **Async Handling**: Built-in support for API calls with loading states
- **Type Safety**: Full TypeScript integration with typed hooks

### State Structure
```typescript
interface RootState {
  user: UserState;           // Authentication and user profile
  theme: ThemeState;         // UI preferences and theming
  connections: ConnectionState; // Professional networking
  groups: GroupState;        // Group management and membership
  groupContent: GroupContentState; // Group polls and announcements
  messages: MessagesState;   // Real-time messaging
  media: MediaState;         // File upload and media handling
  profile: ProfileState;     // Profile management
  meeting: MeetingState;     // Video meeting state
}
```

### Async State Management
```typescript
// createAsyncThunk pattern for API integration
export const fetchConnections = createAsyncThunk(
  'connections/fetchConnections',
  async (_, { rejectWithValue }) => {
    try {
      const response = await connectionApi.getConnections();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice with loading states
const connectionSlice = createSlice({
  name: 'connections',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConnections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});
```

### Global vs Local State Strategy
- **Global State**: User authentication, theme preferences, cross-feature data
- **Local State**: Form inputs, UI interactions, component-specific data
- **Server State**: API responses cached in Redux with TTL invalidation

## Real-Time Features

### Socket.IO Integration
The application implements comprehensive real-time functionality using Socket.IO for instant communication and live updates.

### Connection Management
```typescript
// useSocket.ts - Connection lifecycle management
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      withCredentials: true
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    return () => newSocket.close();
  }, []);
};
```

### Real-Time Event Handling
- **Message Events**: Instant message delivery and read receipts
- **Typing Indicators**: Live typing status with debounced updates
- **Presence Updates**: User online/offline status synchronization
- **Group Events**: Member join/leave notifications
- **Reaction Updates**: Real-time emoji reactions on messages
- **Meeting Events**: Video meeting notifications and participant updates

### Performance Optimizations
- **Connection Pooling**: Shared socket connection across components
- **Event Debouncing**: Throttled typing indicators to reduce server load
- **Optimistic Updates**: Immediate UI updates with server reconciliation
- **Reconnection Logic**: Automatic reconnection with exponential backoff

## Video Conferencing

### LiveKit Integration
The application integrates LiveKit for enterprise-grade video conferencing capabilities.

### Meeting Features
- **Room Creation**: Dynamic meeting room generation
- **Participant Management**: Add/remove participants with role-based permissions
- **Screen Sharing**: Desktop and application sharing
- **Audio/Video Controls**: Mute/unmute, camera on/off controls
- **Chat Integration**: In-meeting text chat
- **Recording**: Meeting recording capabilities
- **Breakout Rooms**: Support for smaller group discussions

### LiveKit Components
```typescript
// LiveKitRoom.tsx - Meeting room wrapper
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const MeetingRoom = ({ token, serverUrl }) => {
  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
    >
      <VideoConference />
    </LiveKitRoom>
  );
};
```

### Meeting State Management
- **Meeting Creation**: API integration for room provisioning
- **Token Management**: Secure JWT token handling for room access
- **Participant Tracking**: Real-time participant state synchronization
- **Meeting History**: Past meeting records and recordings

## UI & UX Principles

### Design Philosophy
The application follows **modern corporate design principles** with emphasis on:

- **Professional Aesthetics**: Clean, minimal interface suitable for business environments
- **Accessibility First**: WCAG 2.1 compliance with keyboard navigation and screen reader support
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Performance**: Smooth 60fps animations with hardware acceleration

### Theme System
```css
/* CSS Variables for consistent theming */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1f2937;
  --accent-color: #3b82f6;
  --accent-gradient: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --accent-color: #60a5fa;
}
```

### Component Reusability
- **Atomic Design**: Button, Input, and other primitive components
- **Compound Components**: Complex UI patterns with consistent APIs
- **Render Props**: Flexible component composition patterns
- **Custom Hooks**: Reusable logic extraction for common patterns

### Loading States & Empty States
- **Skeleton Loaders**: Content-aware loading placeholders
- **Progressive Loading**: Incremental content loading with smooth transitions
- **Empty State Illustrations**: Engaging empty states with clear call-to-actions
- **Error Boundaries**: Graceful error handling with recovery options

## Environment Variables

### Configuration Management
Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000

# LiveKit Configuration
VITE_LIVEKIT_URL=wss://your-livekit-server.com
VITE_LIVEKIT_API_KEY=your-api-key
VITE_LIVEKIT_SECRET_KEY=your-secret-key

# Feature Flags
VITE_ENABLE_CHAT=true
VITE_ENABLE_CONNECTIONS=true
VITE_ENABLE_GROUPS=true
VITE_ENABLE_MEETINGS=true

# Environment
VITE_NODE_ENV=development

# Media Configuration
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Security
VITE_ENABLE_ANALYTICS=false
```

### Environment-Specific Configuration
```typescript
// config/env.ts - Environment validation
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000',
  enableChat: import.meta.env.VITE_ENABLE_CHAT === 'true',
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760')
};
```

### Security Notes
- **No Sensitive Data**: Never store API keys or secrets in environment variables
- **Runtime Validation**: Validate all environment variables at application startup
- **Default Values**: Provide sensible defaults for optional configuration

## Scripts & Commands

### Development Workflow
```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Build Configuration
```typescript
// vite.config.ts - Optimized build configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'react-hot-toast'],
          state: ['@reduxjs/toolkit', 'react-redux'],
          utils: ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### Development Tools
- **Hot Module Replacement**: Instant updates during development
- **TypeScript Checking**: Real-time type validation
- **ESLint Integration**: Code quality enforcement
- **Source Maps**: Debugging support in production builds

## Performance Optimizations

### Code Splitting & Lazy Loading
```typescript
// Route-level code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const ChatPage = lazy(() => import('./pages/ChatPage'));

// Component lazy loading with Suspense
<Suspense fallback={<Loader text="Loading..." />}>
  <Dashboard />
</Suspense>
```

### Bundle Optimization
- **Manual Chunks**: Strategic code splitting for optimal caching
- **Tree Shaking**: Elimination of unused code from final bundle
- **Dynamic Imports**: On-demand loading of heavy components
- **Vendor Separation**: Third-party libraries in separate chunks

### React Performance
```typescript
// Memoization for expensive computations
const MemoizedComponent = memo(({ data }) => {
  const processedData = useMemo(() => 
    expensiveDataProcessing(data), [data]
  );
  
  return <div>{processedData}</div>;
});

// Callback memoization for event handlers
const handleClick = useCallback((id) => {
  onItemClick(id);
}, [onItemClick]);
```

### API Performance
- **Request Caching**: Client-side caching with TTL expiration
- **Request Deduplication**: Prevent duplicate API calls
- **Optimistic Updates**: Immediate UI feedback with server reconciliation
- **Pagination**: Efficient data loading for large datasets

## Security Considerations

### XSS Prevention
- **Content Sanitization**: All user-generated content sanitized before rendering
- **CSP Headers**: Content Security Policy implementation
- **Safe HTML Rendering**: React's built-in XSS protection
- **Input Validation**: Client-side validation with server-side verification

### Authentication Security
```typescript
// Secure cookie configuration
axios.defaults.withCredentials = true; // HTTP-only cookies
axios.defaults.timeout = 10000; // Request timeout protection

// Token validation
const validateToken = async () => {
  try {
    await axios.get('/api/auth/validate');
  } catch (error) {
    // Redirect to login on token expiration
    navigate('/login');
  }
};
```

### Data Protection
- **Sensitive Data Handling**: No sensitive data in localStorage or sessionStorage
- **API Security**: All API calls over HTTPS in production
- **Input Sanitization**: XSS protection for all user inputs
- **Error Handling**: No sensitive information exposed in error messages

### HTTPS Enforcement
```typescript
// Production security headers
if (process.env.NODE_ENV === 'production') {
  // Force HTTPS redirect
  if (location.protocol !== 'https:') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  }
}
```

## Deployment

### Build Process
```bash
# Production build with optimizations
npm run build

# Build output in dist/ directory
dist/
├── assets/
│   ├── index-[hash].js    # Main application bundle
│   ├── vendor-[hash].js   # Third-party dependencies
│   └── index-[hash].css   # Compiled styles
├── index.html             # Application entry point
└── vite.svg              # Application favicon
```

### Environment Configuration
```typescript
// Production environment variables
VITE_API_BASE_URL=https://api.channeliQ.com
VITE_SOCKET_URL=https://api.channeliQ.com
VITE_NODE_ENV=production
```

### Hosting Compatibility
- **Static Hosting**: Compatible with Netlify, Vercel, AWS S3
- **CDN Integration**: Optimized for global content delivery
- **SPA Routing**: Proper fallback configuration for client-side routing
- **Caching Strategy**: Aggressive caching for static assets with cache busting

### CI/CD Integration
```yaml
# GitHub Actions example
name: Deploy Frontend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build application
        run: npm run build
      - name: Deploy to production
        run: npm run deploy
```

## Future Improvements

### Feature Enhancements
- **Advanced Meeting Features**: Whiteboard integration, meeting templates, and scheduling
- **Advanced Search**: Full-text search across messages, files, and profiles
- **Mobile Application**: React Native mobile app development
- **Offline Support**: Progressive Web App with offline capabilities
- **Advanced Analytics**: User engagement and communication metrics
- **AI Integration**: Smart message suggestions and content moderation

### Performance Upgrades
- **Service Worker**: Background sync and push notifications
- **Virtual Scrolling**: Efficient rendering of large message lists
- **Image Optimization**: WebP format with lazy loading and compression
- **Bundle Analysis**: Continuous bundle size monitoring
- **Edge Caching**: CDN integration for global performance
- **Meeting Optimization**: Adaptive bitrate and quality controls

### UX Improvements
- **Keyboard Shortcuts**: Power user keyboard navigation
- **Drag & Drop**: Enhanced file upload with drag-and-drop interface
- **Voice Messages**: Audio message recording and playback
- **Message Threading**: Threaded conversations for better organization
- **Custom Themes**: User-customizable color schemes and layouts
- **Meeting Layouts**: Grid, speaker, and presentation view modes

### Testing Expansion
- **Unit Testing**: Jest and React Testing Library integration
- **Integration Testing**: API integration test suite
- **E2E Testing**: Cypress or Playwright end-to-end testing
- **Visual Regression**: Automated UI consistency testing
- **Performance Testing**: Lighthouse CI integration
- **Meeting Testing**: WebRTC connection and quality testing

### Security Enhancements
- **Two-Factor Authentication**: TOTP-based 2FA implementation
- **End-to-End Encryption**: Message encryption for sensitive communications
- **Session Management**: Advanced session security and monitoring
- **Audit Logging**: Comprehensive user action logging
- **Content Moderation**: AI-powered content filtering
- **Privacy Controls**: Granular privacy settings and data export
- **Meeting Security**: Waiting rooms, meeting locks, and participant verification

## Contribution Guidelines

### Development Standards
- **Code Style**: ESLint and Prettier configuration enforcement
- **Type Safety**: Strict TypeScript configuration with no implicit any
- **Component Standards**: Functional components with hooks pattern
- **Testing Requirements**: Unit tests for all new features
- **Documentation**: JSDoc comments for complex functions

### Pull Request Process
1. **Feature Branch**: Create feature branch from main
2. **Development**: Implement feature with tests and documentation
3. **Code Review**: Peer review with automated checks
4. **Testing**: Comprehensive testing in staging environment
5. **Deployment**: Automated deployment after approval

### Code Quality Gates
- **TypeScript**: Zero type errors required
- **Linting**: ESLint rules must pass
- **Testing**: Minimum 80% code coverage
- **Performance**: Bundle size limits enforced
- **Accessibility**: WCAG 2.1 compliance verification

## License

MIT License - see LICENSE file for details.

Copyright (c) 2024 CorporateChat. All rights reserved.