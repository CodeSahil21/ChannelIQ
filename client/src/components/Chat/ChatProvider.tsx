import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocketChat } from '../../hooks/useSocketChat';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, clearMessages, addMessage, updateMessage, updateReaction } from '../../store/messagesSlice';
import type { RootState, AppDispatch } from '../../store';

interface ChatContextType {
  socket: any;
  isConnected: boolean;
  messages: any[];
  loading: boolean;
  typingUsers: Record<string, string>;
  currentGroupId: string | null;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  sendMessage: (data: any) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  startTyping: (groupId: string) => void;
  stopTyping: (groupId: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector((state: RootState) => state.messages.messages);
  const loading = useSelector((state: RootState) => state.messages.loading);
  
  const {
    socket,
    isConnected,
    typingUsers,
    joinGroup: socketJoinGroup,
    leaveGroup: socketLeaveGroup,
    sendMessage: socketSendMessage,
    editMessage: socketEditMessage,
    deleteMessage: socketDeleteMessage,
    addReaction: socketAddReaction,
    removeReaction: socketRemoveReaction,
    startTyping: socketStartTyping,
    stopTyping: socketStopTyping
  } = useSocketChat();

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      dispatch(addMessage(message));
    };

    const handleMessageUpdate = (data: any) => {
      dispatch(updateMessage(data));
    };

    const handleReactionUpdate = (data: any) => {
      dispatch(updateReaction(data));
    };

    socket.on('message:persisted', handleNewMessage);
    socket.on('message:updated', handleMessageUpdate);
    socket.on('reaction:updated', handleReactionUpdate);

    return () => {
      socket.off('message:persisted', handleNewMessage);
      socket.off('message:updated', handleMessageUpdate);
      socket.off('reaction:updated', handleReactionUpdate);
    };
  }, [socket, dispatch]);

  const joinGroup = async (groupId: string) => {
    if (currentGroupId && currentGroupId !== groupId) {
      socketLeaveGroup(currentGroupId);
    }
    setCurrentGroupId(groupId);
    dispatch(clearMessages());
    
    // Fetch initial messages via async thunk
    dispatch(fetchMessages(groupId));
    
    socketJoinGroup(groupId, (response) => {
      if (!response.success) {
        console.error('Failed to join group:', response.error);
      }
    });
  };

  const leaveGroup = (groupId: string) => {
    socketLeaveGroup(groupId);
    if (currentGroupId === groupId) {
      setCurrentGroupId(null);
      dispatch(clearMessages());
    }
  };

  const sendMessage = (data: any) => {
    if (!currentGroupId) return;
    socketSendMessage({ ...data, groupId: currentGroupId }, (response) => {
      if (!response.success) {
        console.error('Failed to send message:', response.error);
      }
    });
  };

  const editMessage = (messageId: string, content: string) => {
    socketEditMessage(messageId, content, (response) => {
      if (!response.success) {
        console.error('Failed to edit message:', response.error);
      }
    });
  };

  const deleteMessage = (messageId: string) => {
    socketDeleteMessage(messageId, (response) => {
      if (!response.success) {
        console.error('Failed to delete message:', response.error);
      }
    });
  };

  const addReaction = (messageId: string, emoji: string) => {
    socketAddReaction(messageId, emoji, (response) => {
      if (!response.success) {
        console.error('Failed to add reaction:', response.error);
      }
    });
  };

  const removeReaction = (messageId: string, emoji: string) => {
    socketRemoveReaction(messageId, emoji, (response) => {
      if (!response.success) {
        console.error('Failed to remove reaction:', response.error);
      }
    });
  };

  const startTyping = (groupId: string) => {
    socketStartTyping(groupId);
  };

  const stopTyping = (groupId: string) => {
    socketStopTyping(groupId);
  };

  return (
    <ChatContext.Provider value={{
      socket,
      isConnected,
      messages,
      loading,
      typingUsers,
      currentGroupId,
      joinGroup,
      leaveGroup,
      sendMessage,
      editMessage,
      deleteMessage,
      addReaction,
      removeReaction,
      startTyping,
      stopTyping
    }}>
      {children}
    </ChatContext.Provider>
  );
};