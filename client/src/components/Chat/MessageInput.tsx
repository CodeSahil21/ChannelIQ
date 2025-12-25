import React, { useState, useRef, useEffect } from 'react';
import { HiPaperAirplane, HiPaperClip, HiEmojiHappy, HiPlus, HiChartBar, HiSpeakerphone } from 'react-icons/hi';
import { useChatContext } from './ChatProvider';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGroups } from '../../hooks/useGroups';

interface MessageInputProps {
  groupId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ groupId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { sendMessage, startTyping, stopTyping, isConnected } = useChatContext();
  const { currentGroup } = useGroups();
  const currentUser = useSelector((state: RootState) => state.user.user);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const currentUserId = currentUser ? parseInt(currentUser.id) : null;
  const userMembership = currentGroup?.members?.find(m => m.userId === currentUserId);
  const canCreatePollsAnnouncements = userMembership?.role === 'ADMIN' || userMembership?.role === 'CO_ADMIN';

  const handleSend = () => {
    if (!message.trim() || !isConnected) return;

    sendMessage({
      type: 'TEXT',
      content: message.trim()
    });

    setMessage('');
    stopTyping(groupId);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      startTyping(groupId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(groupId);
    }, 1000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        stopTyping(groupId);
      }
    };
  }, [groupId, isTyping, stopTyping]);

  const handleDropdownAction = (action: string) => {
    setShowDropdown(false);
    // Handle different actions
    switch (action) {
      case 'poll':
        console.log('Create poll');
        break;
      case 'announcement':
        console.log('Create announcement');
        break;
      default:
        break;
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <>
      <div className="chat-messages-header">
        <h3>Messages</h3>
        <div className="connection-status">
          <div className={`status-dot ${isConnected ? 'online' : 'offline'}`}></div>
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>
      <div className="message-input-container">
      <div className="message-input-wrapper">
        <div className="input-actions-left">
          <button className="attachment-btn" disabled={!isConnected}>
            <HiPaperClip />
          </button>
          
          {canCreatePollsAnnouncements && (
            <div className="dropdown-wrapper" ref={dropdownRef}>
              <button 
                className="plus-btn" 
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={!isConnected}
              >
                <HiPlus />
              </button>
              
              {showDropdown && (
                <div className="message-dropdown">
                  <button 
                    className="dropdown-item"
                    onClick={() => handleDropdownAction('poll')}
                  >
                    <HiChartBar className="dropdown-icon" />
                    Create Poll
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => handleDropdownAction('announcement')}
                  >
                    <HiSpeakerphone className="dropdown-icon" />
                    Create Announcement
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          className="message-textarea"
          disabled={!isConnected}
          rows={1}
        />
        
        <button className="emoji-btn" disabled={!isConnected}>
          <HiEmojiHappy />
        </button>
        
        <button 
          onClick={handleSend}
          disabled={!message.trim() || !isConnected}
          className="send-btn"
        >
          <HiPaperAirplane />
        </button>
      </div>
      
      {!isConnected && (
        <div className="connection-status">
          <span className="status-indicator offline"></span>
          Connecting...
        </div>
      )}
    </div>
    </>
  );
};