import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { HiMenu, HiLogout } from 'react-icons/hi';
import { clearUser } from '../../store/userSlice';
import type { RootState } from '../../store';
import axios from 'axios';
import toast from 'react-hot-toast';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user.user);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/auth/logout', {}, {
        withCredentials: true
      });
      dispatch(clearUser());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      dispatch(clearUser());
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <button className="menu-button" onClick={onMenuClick}>
            <HiMenu />
          </button>
          <h1 className="navbar-title">Corporate Chat</h1>
        </div>
        
        <div className="navbar-right">
          <div className="user-info">
            <div className="user-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="logout-button" onClick={handleLogout} title="Logout">
            <HiLogout />
          </button>
        </div>
      </div>
    </nav>
  );
};