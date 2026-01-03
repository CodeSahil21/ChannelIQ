import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { HiKey, HiShieldCheck, HiMail, HiLockClosed } from 'react-icons/hi';
import type { ForgotPasswordFormData } from '../../types';
import axios from 'axios';
import toast from 'react-hot-toast';

export const ForgotPasswordForm: React.FC = () => {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:4000/api/auth/forgot-password",
        { email: formData.email },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(response.data.message);
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 400) {
          toast.error("Invalid email address.");
        } else if (err.response.status === 503) {
          toast.error("Service unavailable. Please try again later.");
        } else {
          toast.error("Server error. Please try again.");
        }
      } else {
        toast.error('Password reset request failed. Please try again.');
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
            <HiKey className="hero-badge-icon" />
            <span>Password Recovery</span>
          </div>
          <h1 className="auth-hero-title">Reset Your Password</h1>
          <p className="auth-hero-subtitle">
            Don't worry! Enter your email address and we'll send you a secure OTP to reset your password
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <HiMail className="auth-feature-icon" />
              <span>Email Verification</span>
            </div>
            <div className="auth-feature">
              <HiShieldCheck className="auth-feature-icon" />
              <span>Secure Process</span>
            </div>
            <div className="auth-feature">
              <HiLockClosed className="auth-feature-icon" />
              <span>Account Protection</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="enhanced-auth-card">
        <div className="auth-card-header">
          <h2 className="auth-card-title">Reset Password</h2>
          <p className="auth-card-subtitle">Enter your email to receive an OTP</p>
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
          
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </form>
        
        <div className="auth-links">
          <div className="auth-link-secondary">
            Remember your password? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};