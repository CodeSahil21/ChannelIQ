import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your email to receive an OTP</p>
        </div>
        
        <form onSubmit={handleSubmit}>
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
        
        <div className="auth-link">
          Remember your password? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};