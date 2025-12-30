import React, { useState } from 'react';
import { HiDotsVertical, HiReply, HiPencil, HiTrash, HiBookmark, HiDownload } from 'react-icons/hi';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { pinMessage, unpinMessage } from '../../store/groupContentSlice';
import { useChatContext } from './ChatProvider';
import { useSelector } from 'react-redux';
import { getFileIcon, formatFileSize } from './FileUpload';
import toast from 'react-hot-toast';
import type { RootState } from '../../store';

interface Message {
  id: string;
  content: string | null;
  type: string;
  fileUrl?: string;
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

  const renderMessageContent = () => {
    if (isDeleted) {
      return <span className="deleted-message">This message was deleted</span>;
    }

    if (isEditing) {
      return (
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
      );
    }

    // File message
    if (message.type !== 'TEXT' && message.fileUrl) {
      return (
        <div className="file-message">
          {message.type === 'IMAGE' ? (
            <div className="image-message">
              <img 
                src={message.fileUrl} 
                alt={message.content || 'Image'}
                className="message-image"
                loading="lazy"
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className="image-actions">
                <button 
                  onClick={async (event: React.MouseEvent<HTMLButtonElement>) => {
                    const btn = event.currentTarget as HTMLButtonElement;
                    btn.disabled = true;
                    btn.innerHTML = '<div class="download-spinner"></div>';
                    try {
                      const response = await fetch(message.fileUrl!);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = message.content || 'image';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Download failed:', error);
                    } finally {
                      btn.disabled = false;
                      btn.innerHTML = '<svg>...</svg>';
                    }
                  }}
                  className="download-btn"
                  title="Download image"
                >
                  <HiDownload />
                </button>
              </div>
            </div>
          ) : message.type === 'VIDEO' ? (
            <div className="video-message">
              <video 
                src={message.fileUrl} 
                controls
                className="message-video"
                preload="metadata"
              />
              <div className="video-actions">
                <button 
                  onClick={async (event: React.MouseEvent<HTMLButtonElement>) => {
                    const btn = event.currentTarget as HTMLButtonElement;
                    btn.disabled = true;
                    const originalContent = btn.innerHTML;
                    btn.innerHTML = '<div class="download-spinner"></div>';
                    try {
                      const response = await fetch(message.fileUrl!);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = message.content || 'video';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Download failed:', error);
                    } finally {
                      btn.disabled = false;
                      btn.innerHTML = originalContent;
                    }
                  }}
                  className="download-btn"
                  title="Download video"
                >
                  <HiDownload />
                </button>
              </div>
            </div>
          ) : (
            <div className="document-message">
              <div className="file-info">
                <div className="file-icon">
                  {getFileIcon('application/octet-stream')}
                </div>
                <div className="file-details">
                  <span className="file-name">{message.content || 'File'}</span>
                </div>
              </div>
              <button 
                onClick={async (event: React.MouseEvent<HTMLButtonElement>) => {
                  const btn = event.currentTarget as HTMLButtonElement;
                  btn.disabled = true;
                  const originalContent = btn.innerHTML;
                  btn.innerHTML = '<div class="download-spinner"></div>';
                  try {
                    const response = await fetch(message.fileUrl!);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = message.content || 'file';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Download failed:', error);
                  } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                  }
                }}
                className="download-btn"
                title="Download file"
              >
                <HiDownload />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Text message
    return <span className="message-text">{message.content}</span>;
  };

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
          {renderMessageContent()}
          
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