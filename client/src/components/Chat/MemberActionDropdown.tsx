import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiCog, HiUserRemove, HiVolumeOff, HiVolumeUp } from 'react-icons/hi';

interface MemberActionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  onRoleChange: (role: 'CO_ADMIN' | 'MEMBER') => void;
  onMuteToggle: () => void;
  onRemoveMember: () => void;
  isMuted: boolean;
}

const MemberActionDropdown: React.FC<MemberActionDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef,
  onRoleChange,
  onMuteToggle,
  onRemoveMember,
  isMuted
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate dropdown height
      const viewportHeight = window.innerHeight;
      
      let top = triggerRect.bottom + 4;
      let left = triggerRect.right - 180; // Dropdown width is ~180px
      
      // Adjust if dropdown would go below viewport
      if (top + dropdownHeight > viewportHeight) {
        top = triggerRect.top - dropdownHeight - 4;
      }
      
      // Adjust if dropdown would go outside left edge
      if (left < 8) {
        left = 8;
      }
      
      // Adjust if dropdown would go outside right edge
      if (left + 180 > window.innerWidth - 8) {
        left = window.innerWidth - 188;
      }
      
      setPosition({ top, left });
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const dropdown = (
    <div
      ref={dropdownRef}
      className="member-dropdown-portal"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 1000,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        minWidth: '180px',
        padding: '4px',
        opacity: 0,
        transform: 'translateY(-10px) scale(0.95)',
        animation: 'dropdownSlideIn 0.2s ease-out forwards'
      }}
    >
      <button 
        className="member-dropdown-item"
        onClick={() => {
          onRoleChange('CO_ADMIN');
          onClose();
        }}
      >
        <HiCog />
        Make Co-Admin
      </button>
      <button 
        className="member-dropdown-item"
        onClick={() => {
          onRoleChange('MEMBER');
          onClose();
        }}
      >
        <HiCog />
        Make Member
      </button>
      <button 
        className="member-dropdown-item"
        onClick={() => {
          onMuteToggle();
          onClose();
        }}
      >
        {isMuted ? <HiVolumeUp /> : <HiVolumeOff />}
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
      <button 
        className="member-dropdown-item danger"
        onClick={() => {
          onRemoveMember();
          onClose();
        }}
      >
        <HiUserRemove />
        Remove Member
      </button>
    </div>
  );

  return createPortal(dropdown, document.body);
};

export default MemberActionDropdown;