import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketUser {
  id: number;
  email: string;
  fullName: string;
}

interface MessageData {
  groupId: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'POLL' | 'ANNOUNCEMENT';
  content?: string;
  fileUrl?: string;
  replyToId?: string;
}

interface SocketResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect through API Gateway
    const newSocket = io('http://localhost:4000', {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinGroup = (groupId: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('group:join', { groupId }, callback);
  };

  const leaveGroup = (groupId: string) => {
    socket?.emit('group:leave', { groupId });
  };

  const sendMessage = (data: MessageData, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:send', data, callback);
  };

  const editMessage = (messageId: string, content: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:edit', { messageId, content }, callback);
  };

  const deleteMessage = (messageId: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:delete', { messageId }, callback);
  };

  const addReaction = (messageId: string, emoji: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:reaction:add', { messageId, emoji }, callback);
  };

  const removeReaction = (messageId: string, emoji: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:reaction:remove', { messageId, emoji }, callback);
  };

  const sendTyping = (groupId: string, isTyping: boolean) => {
    socket?.emit('user:typing', { groupId, isTyping });
  };

  const markMessageRead = (messageId: string, groupId: string) => {
    socket?.emit('message:read', { messageId, groupId });
  };

  const markMessageDelivered = (messageId: string, groupId: string) => {
    socket?.emit('message:delivered', { messageId, groupId });
  };

  return {
    socket,
    isConnected,
    joinGroup,
    leaveGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    sendTyping,
    markMessageRead,
    markMessageDelivered
  };
};