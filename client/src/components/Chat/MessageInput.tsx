import React, { useState, useRef, useEffect } from 'react';
import { HiPaperAirplane, HiPaperClip, HiEmojiHappy } from 'react-icons/hi';
import { useChatContext } from './ChatProvider';

interface MessageInputProps {
  groupId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ groupId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, startTyping, stopTyping, isConnected } = useChatContext();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

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
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        stopTyping(groupId);
      }
    };
  }, [groupId, isTyping, stopTyping]);

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
    <div className="message-input-container">
      <div className="message-input-wrapper">
        <button className="attachment-btn" disabled={!isConnected}>
          <HiPaperClip />
        </button>
        
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
  );
};