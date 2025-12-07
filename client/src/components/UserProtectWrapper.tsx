import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import { setUser, clearUser } from '../store/userSlice';
import type { RootState } from '../store';
import { Loader } from './ui/Loader';

interface UserProtectWrapperProps {
  children: React.ReactNode;
}

const UserProtectWrapper: React.FC<UserProtectWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = useSelector((state: RootState) => state.user.user);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          'http://localhost:4000/api/auth/get-profile',
          { withCredentials: true }
        );
        
        console.log("Fetch profile response:", response);
        if (response.status === 200) {
          dispatch(setUser(response.data.data.user));
        } else {
          dispatch(clearUser());
          navigate('/login');
        }
      } catch (err: any) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          dispatch(clearUser());
          console.log("User not authenticated, redirecting to login.");
          navigate('/login');
        } else {
          console.log("User not authenticated, redirecting to login.");
          toast.error(err?.response?.data?.message || err?.message || "Authentication failed");
          dispatch(clearUser());
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [dispatch, navigate]);

  if (isLoading) {
    return <Loader />;
  }

  return <>{children}</>;
};

export default UserProtectWrapper;