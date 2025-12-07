import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';
import { Button } from '../ui/Button';
import type { ResetPasswordFormData } from '../../types';

export const ResetPasswordForm: React.FC = () => {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add reset password logic
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Create your new password</p>
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
          
          <PasswordInput
            label="New Password"
            value={formData.newPassword}
            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
            placeholder="Enter new password (min 8 characters)"
            required
          />
          
          <PasswordInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            placeholder="Confirm your new password"
            required
          />
          
          <Button type="submit" variant="primary">
            Reset Password
          </Button>
        </form>
        
        <div className="auth-link">
          Remember your password? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};