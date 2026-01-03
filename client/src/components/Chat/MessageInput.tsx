import React, { useState, useRef, useEffect } from 'react';
import { HiPaperAirplane, HiEmojiHappy, HiPlus, HiChartBar, HiSpeakerphone } from 'react-icons/hi';
import { useChatContext } from './ChatProvider';
import { useSelector } from 'react-redux';
import { CreatePollModal, CreateAnnouncementModal } from './index';
import { FileUpload } from './FileUpload';
import { useFileUpload } from '../../hooks/useFileUpload';
import { toast } from 'react-hot-toast';
import type { RootState } from '../../store';
import { useGroups } from '../../hooks/useGroups';

interface MessageInputProps {
  groupId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ groupId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { sendMessage, startTyping, stopTyping, isConnected } = useChatContext();
  const { uploadFile } = useFileUpload();
  const { currentGroup } = useGroups();
  const currentUser = useSelector((state: RootState) => state.user.user);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const currentUserId = currentUser ? parseInt(String(currentUser.id)) : null;
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
    
    // Auto-adjust textarea height after clearing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }, 0);
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
    switch (action) {
      case 'poll':
        setShowPollModal(true);
        break;
      case 'announcement':
        setShowAnnouncementModal(true);
        break;
      default:
        break;
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadFile(groupId, file);
      if (result) {
        // File uploaded successfully - message will be created via Kafka event
        // No need to send duplicate message through socket
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      toast.error('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
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
      <div className="message-input-container">
      <div className="message-input-wrapper">
        <div className="input-actions-left">
          <FileUpload 
            onFileSelect={handleFileSelect}
            disabled={!isConnected}
            className="attachment-btn"
            isUploading={isUploading}
          />
          
          {canCreatePollsAnnouncements && (
            <div className="dropdown-wrapper" ref={dropdownRef}>
              <button 
                className="plus-btn" 
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={!isConnected || isUploading}
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
          placeholder={isUploading ? "Uploading file..." : isConnected ? "Type a message..." : "Connecting..."}
          className="message-textarea"
          disabled={!isConnected || isUploading}
          rows={1}
        />
        
        <button className="emoji-btn" disabled={!isConnected || isUploading}>
          <HiEmojiHappy />
        </button>
        
        <button 
          onClick={handleSend}
          disabled={!message.trim() || !isConnected || isUploading}
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
      
      {isUploading && (
        <div className="upload-status">
          <div className="upload-spinner"></div>
          Uploading file...
        </div>
      )}
    </div>

    <CreatePollModal
      isOpen={showPollModal}
      onClose={() => setShowPollModal(false)}
      groupId={groupId}
    />

    <CreateAnnouncementModal
      isOpen={showAnnouncementModal}
      onClose={() => setShowAnnouncementModal(false)}
      groupId={groupId}
    />
    </>
  );
};