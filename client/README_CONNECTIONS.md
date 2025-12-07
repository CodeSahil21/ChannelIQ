# Connection Management System

Complete connection management system with type-safe API integration and animated UI components.

## Features

### Core Functionality
- ✅ Send connection requests with optional messages
- ✅ Accept/decline incoming requests
- ✅ View all connections, pending, and sent requests
- ✅ Block/unblock users
- ✅ Remove connections
- ✅ Real-time connection status
- ✅ Connection statistics dashboard

### Components

#### Pages
- **Connections** (`/connections`) - Main page with tabbed interface

#### UI Components
- **ConnectionCard** - Reusable card for displaying user info
- **ConnectionButton** - Dynamic button based on connection status
- **ConnectionStats** - Animated statistics cards
- **PendingRequests** - Manage incoming requests
- **SentRequests** - View outgoing requests
- **ConnectionsList** - Grid of all connections
- **BlockedUsers** - Manage blocked users
- **SendRequestModal** - Modal for sending requests
- **ConnectionNotificationBadge** - Badge showing pending count

### API Integration

All endpoints from the User Management Service are integrated:

```typescript
// Send connection request
connectionApi.sendRequest({ receiverId: 42, message: "Hi!" })

// Accept/decline requests
connectionApi.acceptRequest(connectionId)
connectionApi.declineRequest(connectionId)

// Manage connections
connectionApi.removeConnection(userId)
connectionApi.blockUser(userId)
connectionApi.unblockUser(userId)

// Fetch data
connectionApi.getPendingRequests()
connectionApi.getSentRequests()
connectionApi.getConnections()
connectionApi.getBlockedUsers()
connectionApi.getConnectionStatus(userId)
connectionApi.getStats()
```

### Custom Hook

`useConnections()` provides:
- State management for all connection data
- Loading states
- Error handling with toast notifications
- Automatic state updates after actions

### Type Safety

All API responses and requests are fully typed:
- `ConnectionResponse`
- `ConnectionStatus`
- `ConnectionStatusString`
- `ConnectionStatsResponse`
- `ApiResponse<T>` with success/error discrimination

### Animations

Using Framer Motion:
- Page transitions
- Card hover effects
- List animations with AnimatePresence
- Modal animations
- Button interactions
- Notification badge pulse

### Usage Example

```tsx
import { ConnectionButton } from '@/components/connections';

// In any component
<ConnectionButton userId={42} userName="John Doe" />
```

The button automatically:
- Fetches connection status
- Shows appropriate action (Connect/Pending/Connected/Blocked)
- Handles all interactions
- Updates UI after actions

### Navigation

Add to your navigation:
```tsx
import { FaUsers } from 'react-icons/fa';
import { ConnectionNotificationBadge } from '@/components/connections';

<Link to="/connections" className="relative">
  <FaUsers />
  Connections
  <ConnectionNotificationBadge />
</Link>
```

### Dark Mode Support

All components support dark mode via Tailwind's `dark:` classes.

### Responsive Design

- Mobile: Single column layout
- Tablet: 2 column grid
- Desktop: 3 column grid

## File Structure

```
src/
├── api/
│   └── connection.api.ts          # API client
├── components/
│   └── connections/
│       ├── BlockedUsers.tsx
│       ├── ConnectionButton.tsx
│       ├── ConnectionCard.tsx
│       ├── ConnectionNotificationBadge.tsx
│       ├── ConnectionStats.tsx
│       ├── ConnectionsList.tsx
│       ├── PendingRequests.tsx
│       ├── SendRequestModal.tsx
│       ├── SentRequests.tsx
│       └── index.ts
├── hooks/
│   └── useConnections.ts          # Custom hook
├── pages/
│   └── Connections.tsx            # Main page
└── types/
    └── connection.types.ts        # TypeScript types
```

## API Base URL

Configure in `connection.api.ts`:
```typescript
const API_BASE = 'http://localhost:4000/api/connections';
```

## Dependencies

Already installed:
- axios
- framer-motion
- react-hot-toast
- react-icons
- react-router-dom

## Getting Started

1. Navigate to `/connections` route
2. View your connection statistics
3. Switch between tabs to manage different aspects
4. Use ConnectionButton component anywhere to add connection functionality
