import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatContext } from './ChatProvider';

interface ChatMessagesProps {
  groupId: string;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ groupId }) => {
  const { isConnected } = useChatContext();

  return (
    <div className="chat-messages">
      <div className="chat-messages-header">
        <h3>Messages</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>
      
      <MessageList groupId={groupId} />
      <MessageInput groupId={groupId} />
    </div>
  );
};