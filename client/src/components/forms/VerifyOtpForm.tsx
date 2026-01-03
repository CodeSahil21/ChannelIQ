import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { HiShieldCheck, HiMail, HiKey, HiClock } from 'react-icons/hi';
import type { VerifyOtpFormData } from '../../types';
import axios from 'axios';
import toast from 'react-hot-toast';

export const VerifyOtpForm: React.FC = () => {
  const [formData, setFormData] = useState<VerifyOtpFormData>({
    email: '',
    otp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const email = location.state?.email;
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:4000/api/auth/verify-otp",
        { email: formData.email, otp: formData.otp },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(response.data.message);
      navigate('/reset-password', { state: { email: formData.email, otp: formData.otp } });
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 400) {
          toast.error("Invalid or expired OTP.");
        } else if (err.response.status === 503) {
          toast.error("Service unavailable. Please try again later.");
        } else {
          toast.error("Server error. Please try again.");
        }
      } else {
        toast.error('OTP verification failed. Please try again.');
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
            <span>Secure Verification</span>
          </div>
          <h1 className="auth-hero-title">Verify Your Identity</h1>
          <p className="auth-hero-subtitle">
            We've sent a secure 6-digit code to your email address. Enter it below to continue with password reset
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <HiMail className="auth-feature-icon" />
              <span>Email Sent</span>
            </div>
            <div className="auth-feature">
              <HiKey className="auth-feature-icon" />
              <span>6-Digit Code</span>
            </div>
            <div className="auth-feature">
              <HiClock className="auth-feature-icon" />
              <span>Valid for 10 mins</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="enhanced-auth-card">
        <div className="auth-card-header">
          <h2 className="auth-card-title">Verify OTP</h2>
          <p className="auth-card-subtitle">Enter the 6-digit code sent to your email</p>
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
          
          <Input
            label="OTP Code"
            type="text"
            value={formData.otp}
            onChange={(e) => setFormData({...formData, otp: e.target.value})}
            placeholder="Enter 6-digit OTP"
            className="otp-input"
            required
          />
          
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>
        
        <div className="auth-links">
          <div className="auth-link-secondary">
            Didn't receive the code? <Link to="/forgot-password">Resend OTP</Link>
          </div>
        </div>
      </div>
    </div>
  );
};