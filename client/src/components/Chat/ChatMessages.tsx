import React from 'react';
import { HiChartBar, HiSpeakerphone, HiBookmark } from 'react-icons/hi';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatContext } from './ChatProvider';

interface ChatMessagesProps {
  groupId: string;
  userRole?: string;
  onShowPolls?: () => void;
  onShowAnnouncements?: () => void;
  onShowPinnedMessages?: () => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  groupId, 
  userRole,
  onShowPolls, 
  onShowAnnouncements,
  onShowPinnedMessages
}) => {
  const { isConnected } = useChatContext();

  return (
    <div className="chat-messages full-height">
      <div className="chat-messages-header">
        <h3>Messages</h3>
        <div className="chat-header-actions">
          <button 
            className="header-action-btn"
            onClick={onShowPolls}
            title="View Polls"
          >
            <HiChartBar />
            Polls
          </button>
          <button 
            className="header-action-btn"
            onClick={onShowAnnouncements}
            title="View Announcements"
          >
            <HiSpeakerphone />
            Announcements
          </button>
          <button 
            className="header-action-btn"
            onClick={onShowPinnedMessages}
            title="View Pinned Messages"
          >
            <HiBookmark />
            Pinned
          </button>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>
      
      <div className="chat-messages-body">
        <MessageList groupId={groupId} userRole={userRole} />
        <MessageInput groupId={groupId} />
      </div>
    </div>
  );
};