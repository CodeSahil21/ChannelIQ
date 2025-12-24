import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocketChat } from '../../hooks/useSocketChat';

interface ChatContextType {
  socket: any;
  isConnected: boolean;
  messages: any[];
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
  const {
    socket,
    isConnected,
    messages,
    typingUsers,
    joinGroup: socketJoinGroup,
    leaveGroup: socketLeaveGroup,
    sendMessage: socketSendMessage,
    editMessage: socketEditMessage,
    deleteMessage: socketDeleteMessage,
    addReaction: socketAddReaction,
    removeReaction: socketRemoveReaction,
    startTyping: socketStartTyping,
    stopTyping: socketStopTyping,
    clearMessages
  } = useSocketChat();

  const joinGroup = (groupId: string) => {
    if (currentGroupId && currentGroupId !== groupId) {
      socketLeaveGroup(currentGroupId);
    }
    setCurrentGroupId(groupId);
    clearMessages();
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
      clearMessages();
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