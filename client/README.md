# CorporateChat Client

React frontend for the CorporateChat platform with modern UI and real-time features.

## Port: 3000 (dev) / 5173 (vite)

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hot Toast** for notifications
- **Axios** for API calls

## Features

### Authentication
- Login/Register with validation
- OTP verification
- Password reset
- Protected routes

### Profile Management
- Complete profile creation/editing
- Profile image upload with direct MinIO URLs
- Skills and languages management
- Social links integration

### Connections
- Send/accept/decline connection requests
- User search and discovery
- Connection statistics
- Block/unblock users
- Remove connections

### UI/UX
- Responsive design
- Dark/light theme support
- Smooth animations
- Loading states
- Error handling
- Toast notifications

## Project Structure

```
src/
├── api/           # API client configurations
├── components/    # Reusable UI components
│   ├── ui/        # Basic UI components
│   ├── forms/     # Form components
│   ├── profile/   # Profile-related components
│   ├── connections/ # Connection components
│   └── layout/    # Layout components
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── store/         # Redux store configuration
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Key Components

### Image Handling
- `DirectImage` component for MinIO public URLs
- Automatic URL construction: `http://localhost:9000/profile-images/{filename}`
- Fallback support for external URLs
- No API calls required for image display

### API Integration
- Centralized API clients for each service
- Automatic error handling
- Request/response interceptors
- Type-safe API calls

### State Management
- Redux Toolkit for global state
- User authentication state
- Theme preferences
- Connection management

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:4000
```

## Available Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

## API Endpoints Used

- **Auth:** `/api/auth/*`
- **Users:** `/api/users/*`
- **Connections:** `/api/connections/*`
- **Media:** `/api/media/*`

## Image Upload Flow

1. User selects image file
2. Validation (size, format)
3. Upload to media service via API gateway
4. Receive filename and public URL
5. Update profile with filename
6. Display image using direct MinIO URL

## Development Setup

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```

## Performance Optimizations

- Lazy loading of components
- Image optimization
- Bundle splitting
- Tree shaking
- Efficient re-renders with React.memo