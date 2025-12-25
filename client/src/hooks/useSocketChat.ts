import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

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

interface Message {
  id: string;
  content: string | null;
  type: string;
  senderId: number;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
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

export const useSocketChat = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const currentUser = useSelector((state: RootState) => state.user.user);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      console.log('No user found, skipping socket connection');
      return;
    }

    console.log('Connecting socket for user:', currentUser.id);
    const newSocket = io('http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      path: '/socket.io/'
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('Error details:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('🔌 Socket disconnected:', reason);
    });

    newSocket.on('message:persisted', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('message:updated', (data: { messageId: string; content?: string; isDeleted: boolean; updatedAt: Date }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, content: data.isDeleted ? null : data.content || msg.content, isDeleted: data.isDeleted, updatedAt: data.updatedAt }
          : msg
      ));
    });

    newSocket.on('reaction:updated', (data: { messageId: string; emoji: string; userId: number; action: 'add' | 'remove' }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const reactions = [...msg.reactions];
          const existingIndex = reactions.findIndex(r => r.emoji === data.emoji && r.userId === data.userId);
          
          if (data.action === 'add' && existingIndex === -1) {
            reactions.push({
              id: `${data.messageId}-${data.emoji}-${data.userId}`,
              emoji: data.emoji,
              userId: data.userId,
              user: { fullName: 'User' }
            });
          } else if (data.action === 'remove' && existingIndex !== -1) {
            reactions.splice(existingIndex, 1);
          }
          
          return { ...msg, reactions };
        }
        return msg;
      }));
    });

    newSocket.on('typing:updated', (data: { groupId: string; userId: number; isTyping: boolean; fullName: string }) => {
      if (data.userId !== currentUser?.id) {
        setTypingUsers(prev => {
          const updated = { ...prev };
          if (data.isTyping) {
            updated[data.userId] = data.fullName;
          } else {
            delete updated[data.userId];
          }
          return updated;
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentUser?.id]);

  const joinGroup = useCallback((groupId: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('group:join', { groupId }, callback);
  }, [socket]);

  const leaveGroup = useCallback((groupId: string) => {
    socket?.emit('group:leave', { groupId });
  }, [socket]);

  const sendMessage = useCallback((data: MessageData, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:send', data, callback);
  }, [socket]);

  const editMessage = useCallback((messageId: string, content: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:edit', { messageId, content }, callback);
  }, [socket]);

  const deleteMessage = useCallback((messageId: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:delete', { messageId }, callback);
  }, [socket]);

  const addReaction = useCallback((messageId: string, emoji: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:reaction:add', { messageId, emoji }, callback);
  }, [socket]);

  const removeReaction = useCallback((messageId: string, emoji: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('message:reaction:remove', { messageId, emoji }, callback);
  }, [socket]);

  const sendTyping = useCallback((groupId: string, isTyping: boolean) => {
    socket?.emit('user:typing', { groupId, isTyping });
  }, [socket]);

  const startTyping = useCallback((groupId: string) => {
    sendTyping(groupId, true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(groupId, false);
    }, 3000);
  }, [sendTyping]);

  const stopTyping = useCallback((groupId: string) => {
    sendTyping(groupId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [sendTyping]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const votePoll = useCallback((pollId: string, optionId: string, callback?: (response: SocketResponse) => void) => {
    socket?.emit('poll:vote', { pollId, optionId }, callback);
  }, [socket]);

  return {
    socket,
    isConnected,
    messages,
    typingUsers,
    joinGroup,
    leaveGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
    clearMessages,
    votePoll
  };
};