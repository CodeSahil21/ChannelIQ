import React from 'react';
import { HiHome, HiUser, HiCog, HiX, HiUserGroup, HiChat, HiVideoCamera } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">CC</div>
            <h2>Corporate Chat</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <HiX />
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Navigation</div>
            <button 
              className="sidebar-item"
              onClick={() => handleNavigation('/dashboard')}
            >
              <HiHome className="sidebar-icon" />
              <span>Dashboard</span>
            </button>
            
            <button 
              className="sidebar-item"
              onClick={() => handleNavigation('/profile')}
            >
              <HiUser className="sidebar-icon" />
              <span>My Profile</span>
            </button>
            
            <button 
              className="sidebar-item"
              onClick={() => handleNavigation('/connections')}
            >
              <HiUserGroup className="sidebar-icon" />
              <span>Connections</span>
            </button>
            
            <button 
              className="sidebar-item"
              onClick={() => handleNavigation('/chat')}
            >
              <HiChat className="sidebar-icon" />
              <span>Chat</span>
            </button>
            
            <button 
              className="sidebar-item"
              onClick={() => handleNavigation('/meetings')}
            >
              <HiVideoCamera className="sidebar-icon" />
              <span>Meetings</span>
            </button>
          </div>
          
          <div className="sidebar-section">
            <div className="sidebar-section-title">Settings</div>
            <button 
              className="sidebar-item"
              onClick={() => handleNavigation('/preferences')}
            >
              <HiCog className="sidebar-icon" />
              <span>Preferences</span>
            </button>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <div className="sidebar-footer-text">
            <div className="footer-title">Corporate Chat</div>
            <div className="footer-version">Version 1.0.0</div>
          </div>
        </div>
      </div>
    </>
  );
};