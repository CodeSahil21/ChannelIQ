import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { useChatContext } from './ChatProvider';
import { Loader } from '../ui/Loader';
import type { RootState } from '../../store';

interface MessageListProps {
  groupId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ groupId }) => {
  const { messages, typingUsers } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const groupMessages = messages.filter(msg => msg.groupId === groupId);

  return (
    <div className="message-list">
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
              />
            );
          })
        )}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};