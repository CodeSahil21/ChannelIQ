import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';
import { Button } from '../ui/Button';
import { Loader } from '../ui/Loader';
import { HiShieldCheck, HiLightningBolt, HiUserGroup } from 'react-icons/hi';
import type { LoginFormData } from '../../types';
import type { RootState } from '../../store';
import { setUser } from '../../store/userSlice';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../../config/api';

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(
          `${API_CONFIG.BASE_URL}/api/auth/get-profile`,
          { withCredentials: true }
        );
        
        if (response.status === 200) {
          dispatch(setUser(response.data.data.user));
          navigate('/profile');
        }
      } catch (err) {
        // User not authenticated, stay on login page
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [dispatch, navigate]);

  if (isCheckingAuth) {
    return <Loader text="Checking authentication..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/auth/login`,
        { email: formData.email, password: formData.password },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(response.data.message);
      dispatch(setUser(response.data.data.user));
      navigate('/home');
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 400) {
          toast.error("Validation error: check email and password.");
        } else if (err.response.status === 401) {
          toast.error("Invalid credentials. Please try again.");
        } else if (err.response.status === 503) {
          toast.error("Service unavailable. Please try again later.");
        } else {
          toast.error("Server error. Please try again.");
        }
      } else {
        toast.error('Login failed. Please check your credentials.');
        toast.error("Network error. Could not connect to server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="enhanced-auth-container">
      <div className="auth-hero-section">
        <div className="auth-hero-content">
          <div className="auth-hero-badge">
            <HiShieldCheck className="hero-badge-icon" />
            <span>Secure Login</span>
          </div>
          <h1 className="auth-hero-title">Welcome to ChannelIQ</h1>
          <p className="auth-hero-subtitle">
            Your professional communication platform for seamless collaboration
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <HiShieldCheck className="auth-feature-icon" />
              <span>Enterprise Security</span>
            </div>
            <div className="auth-feature">
              <HiLightningBolt className="auth-feature-icon" />
              <span>Real-time Messaging</span>
            </div>
            <div className="auth-feature">
              <HiUserGroup className="auth-feature-icon" />
              <span>Team Collaboration</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="enhanced-auth-card">
        <div className="auth-card-header">
          <h2 className="auth-card-title">Sign In</h2>
          <p className="auth-card-subtitle">Welcome back! Please sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="Enter your email"
            required
          />
          
          <PasswordInput
            label="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Enter your password"
            required
          />
          
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="auth-links">
          <Link to="/forgot-password" className="auth-link-primary">
            Forgot your password?
          </Link>
          <div className="auth-link-secondary">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};