import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

interface Message {
  id: string;
  content: string | null;
  type: string;
  senderId: number;
  groupId: string;
  createdAt: Date;
  sender: {
    id: number;
    fullName: string;
  };
}

interface SocketProps {
  groupId: string;
  onMessage?: (message: Message) => void;
}

export const Socket: React.FC<SocketProps> = ({ groupId, onMessage }) => {
  const { socket, isConnected, joinGroup, leaveGroup } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join the group
    joinGroup(groupId, (response) => {
      if (response.success) {
        console.log('Joined group:', groupId);
      } else {
        console.error('Failed to join group:', response.error);
      }
    });

    // Listen for new messages
    socket.on('message:persisted', (message: Message) => {
      setMessages(prev => [...prev, message]);
      onMessage?.(message);
    });

    // Listen for message updates
    socket.on('message:updated', (data: { messageId: string; content?: string; isDeleted: boolean }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, content: data.isDeleted ? '[Deleted]' : data.content || msg.content }
          : msg
      ));
    });

    // Listen for reactions
    socket.on('reaction:updated', (data: { messageId: string; emoji: string; userId: number; action: 'add' | 'remove' }) => {
      console.log('Reaction updated:', data);
    });

    // Listen for typing indicators
    socket.on('typing:updated', (data: { groupId: string; userId: number; isTyping: boolean; fullName: string }) => {
      console.log('Typing:', data.fullName, data.isTyping ? 'is typing...' : 'stopped typing');
    });

    // Listen for user status
    socket.on('user:status', (data: { userId: number; status: 'online' | 'offline' }) => {
      console.log('User status:', data.userId, data.status);
    });

    return () => {
      leaveGroup(groupId);
      socket.off('message:persisted');
      socket.off('message:updated');
      socket.off('reaction:updated');
      socket.off('typing:updated');
      socket.off('user:status');
    };
  }, [socket, isConnected, groupId, joinGroup, leaveGroup, onMessage]);

  return (
    <div className="socket-status">
      <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      <div className="message-count">
        Messages: {messages.length}
      </div>
    </div>
  );
};