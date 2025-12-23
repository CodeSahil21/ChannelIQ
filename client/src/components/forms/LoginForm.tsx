import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';
import { Button } from '../ui/Button';
import { Loader } from '../ui/Loader';
import type { LoginFormData } from '../../types';
import type { RootState } from '../../store';
import { setUser } from '../../store/userSlice';
import axios from 'axios';
import toast from 'react-hot-toast';

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
          'http://localhost:4000/api/auth/get-profile',
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
        "http://localhost:4000/api/auth/login",
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account</p>
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
        
        <div className="auth-link">
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>
        
        <div className="auth-link">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};