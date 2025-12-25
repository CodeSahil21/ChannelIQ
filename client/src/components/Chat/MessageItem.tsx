import React, { useState } from 'react';
import { HiDotsVertical, HiReply, HiPencil, HiTrash, HiBookmark } from 'react-icons/hi';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { pinMessage, unpinMessage } from '../../store/groupContentSlice';
import { useChatContext } from './ChatProvider';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '../../store';

interface Message {
  id: string;
  content: string | null;
  type: string;
  senderId: number;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  isPinned?: boolean;
  sender: {
    id: number;
    fullName: string;
    profileUrl?: string;
  };
  reactions: Array<{
    id: string;
    emoji: string;
    userId: number;
    user: { fullName: string };
  }>;
}

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
  userRole?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, showAvatar, userRole }) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const { editMessage, deleteMessage, addReaction, removeReaction } = useChatContext();
  const dispatch = useAppDispatch();
  const currentUser = useSelector((state: RootState) => state.user.user);
  const currentUserId = currentUser?.id || null;

  const isOwnMessage = currentUserId === message.senderId;
  const isDeleted = message.isDeleted;
  const messageAge = Date.now() - new Date(message.createdAt).getTime();
  const canEdit = isOwnMessage && !isDeleted && messageAge < 10 * 60 * 1000;
  const canPin = userRole === 'ADMIN' || userRole === 'CO_ADMIN';

  const handlePin = async () => {
    try {
      if (message.isPinned) {
        await dispatch(unpinMessage({ groupId: message.groupId, messageId: message.id })).unwrap();
        toast.success('Message unpinned');
      } else {
        await dispatch(pinMessage({ groupId: message.groupId, messageId: message.id })).unwrap();
        toast.success('Message pinned');
      }
    } catch (error) {
      toast.error(message.isPinned ? 'Failed to unpin message' : 'Failed to pin message');
    }
    setShowActions(false);
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      editMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMessage(message.id);
    setShowActions(false);
  };

  const handleReaction = (emoji: string) => {
    const reactions = message.reactions || [];
    const existingReaction = reactions.find(r => r.emoji === emoji && r.userId === currentUserId);
    if (existingReaction) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupedReactions = (message.reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  return (
    <div className={`message-item ${isOwnMessage ? 'own-message' : ''}`}>
      {showAvatar && (
        <div className="message-avatar">
          {message.sender.profileUrl ? (
            <img src={message.sender.profileUrl} alt={message.sender.fullName} />
          ) : (
            <div className="message-avatar-initials">
              {getInitials(message.sender.fullName)}
            </div>
          )}
        </div>
      )}
      
      <div className="message-content">
        {showAvatar && (
          <div className="message-header">
            <span className="message-sender">{message.sender.fullName}</span>
            <span className="message-time">{formatTime(message.createdAt)}</span>
          </div>
        )}
        
        <div 
          className="message-bubble"
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {isDeleted ? (
            <span className="deleted-message">This message was deleted</span>
          ) : isEditing ? (
            <div className="edit-message">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                onBlur={handleEdit}
                autoFocus
              />
            </div>
          ) : (
            <span className="message-text">{message.content}</span>
          )}
          
          {showActions && !isDeleted && (
            <div className="message-actions">
              {canPin && (
                <button onClick={handlePin} className="action-btn" title={message.isPinned ? 'Unpin message' : 'Pin message'}>
                  <HiBookmark className={message.isPinned ? 'text-blue-500' : ''} />
                </button>
              )}
              {isOwnMessage && canEdit && (
                <button onClick={() => setIsEditing(true)} className="action-btn">
                  <HiPencil />
                </button>
              )}
              {isOwnMessage && (
                <button onClick={handleDelete} className="action-btn">
                  <HiTrash />
                </button>
              )}
            </div>
          )}
        </div>
        
        {Object.keys(groupedReactions).length > 0 && (
          <div className="message-reactions">
            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
              <button
                key={emoji}
                className={`reaction-btn ${reactions.some(r => r.userId === currentUserId) ? 'active' : ''}`}
                onClick={() => handleReaction(emoji)}
              >
                {emoji} {reactions.length}
              </button>
            ))}
          </div>
        )}
        
        <div className="quick-reactions">
          {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
            <button
              key={emoji}
              className="quick-reaction"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};