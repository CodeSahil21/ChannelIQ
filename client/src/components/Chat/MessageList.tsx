import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { useChatContext } from './ChatProvider';
import { Loader } from '../ui/Loader';
import type { RootState } from '../../store';

interface MessageListProps {
  groupId: string;
  userRole?: string;
}

const MessageSkeleton = React.memo(() => (
  <div className="message-skeleton">
    <div className="skeleton-avatar"></div>
    <div className="skeleton-content">
      <div className="skeleton-header"></div>
      <div className="skeleton-bubble"></div>
    </div>
  </div>
));

export const MessageList: React.FC<MessageListProps> = ({ groupId, userRole }) => {
  const { messages, loading, typingUsers } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Auto-scroll when messages change or typing indicator appears/disappears
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, Object.keys(typingUsers).length]);

  const groupMessages = React.useMemo(() => 
    messages.filter(msg => msg.groupId === groupId), 
    [messages, groupId]
  );

  if (loading && groupMessages.length === 0) {
    return (
      <div className="message-list">
        <div className="messages-container">
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="message-list" ref={messagesContainerRef}>
      <div className="messages-container">
        {groupMessages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          groupMessages.map((message, index) => {
            const prevMessage = index > 0 ? groupMessages[index - 1] : null;
            const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
            
            return (
              <MessageItem
                key={message.id}
                message={message}
                showAvatar={showAvatar}
                userRole={userRole}
              />
            );
          })
        )}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={messagesEndRef} style={{ height: '1px', width: '100%' }} />
      </div>
    </div>
  );
};