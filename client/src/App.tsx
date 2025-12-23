
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Loader } from './components/ui/Loader';

import UserProtectWrapper from './components/UserProtectWrapper';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyOtp } from './pages/VerifyOtp';
import { ResetPassword } from './pages/ResetPassword';

// Lazy load heavy components
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Preferences = lazy(() => import('./pages/Preferences'));
const ConnectionsWithContext = lazy(() => import('./pages/Connections'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={
          <UserProtectWrapper>
            <Suspense fallback={<Loader text="Loading Home..." />}>
              <Home />
            </Suspense>
          </UserProtectWrapper>
        } />
        <Route path="/dashboard" element={
          <UserProtectWrapper>
            <Suspense fallback={<Loader text="Loading Dashboard..." />}>
              <Dashboard />
            </Suspense>
          </UserProtectWrapper>
        } />
        <Route path="/profile" element={
          <UserProtectWrapper>
            <Suspense fallback={<Loader text="Loading Profile..." />}>
              <Profile />
            </Suspense>
          </UserProtectWrapper>
        } />
        <Route path="/preferences" element={
          <UserProtectWrapper>
            <Suspense fallback={<Loader text="Loading Preferences..." />}>
              <Preferences />
            </Suspense>
          </UserProtectWrapper>
        } />
        <Route path="/connections" element={
          <UserProtectWrapper>
            <Suspense fallback={<Loader text="Loading Connections..." />}>
              <ConnectionsWithContext />
            </Suspense>
          </UserProtectWrapper>
        } />
        <Route path="/chat" element={
          <UserProtectWrapper>
            <Suspense fallback={<Loader text="Loading Chat..." />}>
              <ChatPage />
            </Suspense>
           </UserProtectWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AnimatedRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            },
            success: {
              iconTheme: {
                primary: '#059669',
                secondary: '#fff'
              }
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#fff'
              }
            }
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default App;