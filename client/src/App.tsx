
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

import UserProtectWrapper from './components/UserProtectWrapper';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyOtp } from './pages/VerifyOtp';
import { ResetPassword } from './pages/ResetPassword';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Preferences } from './pages/Preferences';
import ConnectionsWithContext from './pages/Connections';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={
          <UserProtectWrapper>
            <Home />
          </UserProtectWrapper>
        } />
        <Route path="/dashboard" element={
          <UserProtectWrapper>
            <Dashboard />
          </UserProtectWrapper>
        } />
        <Route path="/profile" element={
          <UserProtectWrapper>
            <Profile />
          </UserProtectWrapper>
        } />
        <Route path="/preferences" element={
          <UserProtectWrapper>
            <Preferences />
          </UserProtectWrapper>
        } />
        <Route path="/connections" element={
          <UserProtectWrapper>
            <ConnectionsWithContext />
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