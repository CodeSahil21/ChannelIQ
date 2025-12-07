import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
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
        console.error(err);
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
          <h1 className="auth-title">Verify OTP</h1>
          <p className="auth-subtitle">Enter the 6-digit code sent to your email</p>
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
        
        <div className="auth-link">
          Didn't receive the code? <Link to="/forgot-password">Resend OTP</Link>
        </div>
      </div>
    </div>
  );
};