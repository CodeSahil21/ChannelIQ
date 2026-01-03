import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';
import { Button } from '../ui/Button';
import { Loader } from '../ui/Loader';
import { HiUserAdd, HiShieldCheck, HiLightningBolt, HiUserGroup } from 'react-icons/hi';
import type { RegisterFormData } from '../../types';
import { setUser } from '../../store/userSlice';
import axios from 'axios';
import toast from 'react-hot-toast';

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(
          'http://localhost:4000/api/auth/get-profile',
          { withCredentials: true }
        );
        
        if (response.status === 200) {
          dispatch(setUser(response.data.data.user));
          navigate('/profile');
        }
      } catch (err) {
        // User not authenticated, stay on register page
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
        "http://localhost:4000/api/auth/register",
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
        } else if (err.response.status === 409) {
          toast.error("Email already exists.");
        } else if (err.response.status === 503) {
          toast.error("Service unavailable. Please try again later.");
        } else {
          toast.error("Server error. Please try again.");
        }
      } else {
        toast.error('Registration failed. Please try again.');
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
            <HiUserAdd className="hero-badge-icon" />
            <span>Join ChannelIQ</span>
          </div>
          <h1 className="auth-hero-title">Start Your Journey</h1>
          <p className="auth-hero-subtitle">
            Create your account and connect with your team in a secure, professional environment
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
          <h2 className="auth-card-title">Create Account</h2>
          <p className="auth-card-subtitle">Join our ChannelIQ platform today</p>
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
            placeholder="Create a password (min 6 characters)"
            required
          />
          
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        
        <div className="auth-links">
          <div className="auth-link-secondary">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};