import { randomUUID } from 'crypto';
import { GroupRole } from '@prisma/client';
import { TypedServer, SystemMessage, MessageWithRelations } from './types';

let socketServer: TypedServer | null = null;

export const setSocketServer = (io: TypedServer): void => {
  socketServer = io;
};

export const getSocketServer = (): TypedServer | null => {
  return socketServer;
};

// Simple socket methods
export const emitNewMessage = (groupId: string, message: MessageWithRelations | SystemMessage): void => {
  socketServer?.to(`group:${groupId}`).emit('message:persisted', message);
};

export const emitMessageRead = (groupId: string, messageId: string, userId: number): void => {
  socketServer?.to(`group:${groupId}`).emit('message:read', { messageId, userId });
};

export const emitMessageDelivered = (groupId: string, messageId: string, userId: number): void => {
  socketServer?.to(`group:${groupId}`).emit('message:delivered', { messageId, userId });
};

export const emitMessageUpdated = (groupId: string, messageId: string, content?: string, isDeleted: boolean = false): void => {
  const payload: { messageId: string; isDeleted: boolean; updatedAt: Date; content?: string } = {
    messageId,
    isDeleted,
    updatedAt: new Date()
  };
  
  if (content !== undefined) {
    payload.content = content;
  }
  
  socketServer?.to(`group:${groupId}`).emit('message:updated', payload);
};

export const emitReactionUpdate = (groupId: string, messageId: string, emoji: string, userId: number, action: 'add' | 'remove'): void => {
  socketServer?.to(`group:${groupId}`).emit('reaction:updated', { messageId, emoji, userId, action });
};

export const emitTypingUpdate = (groupId: string, userId: number, isTyping: boolean, fullName: string): void => {
  socketServer?.to(`group:${groupId}`).emit('typing:updated', { groupId, userId, isTyping, fullName });
};

export const emitPollVoteUpdate = (groupId: string, pollId: string, optionId: string, userId: number, voteCount: number): void => {
  socketServer?.to(`group:${groupId}`).emit('poll:vote:update', { pollId, optionId, userId, voteCount });
};

export const emitUserStatusUpdate = (userId: number, status: 'online' | 'offline', lastSeen?: Date): void => {
  const payload: { userId: number; status: 'online' | 'offline'; lastSeen?: Date } = { userId, status };
  
  if (lastSeen !== undefined) {
    payload.lastSeen = lastSeen;
  }
  
  socketServer?.emit('user:status', payload);
};

export const emitGroupMemberAdded = (groupId: string, userId: number, fullName: string, role: GroupRole): void => {
  socketServer?.to(`group:${groupId}`).emit('group:member:added', { groupId, userId, fullName, role });
};

export const emitGroupMemberRemoved = (groupId: string, userId: number, fullName: string): void => {
  socketServer?.to(`group:${groupId}`).emit('group:member:removed', { groupId, userId, fullName });
};

export const emitGroupMemberRoleUpdated = (groupId: string, userId: number, fullName: string, newRole: GroupRole): void => {
  socketServer?.to(`group:${groupId}`).emit('group:member:role:updated', { groupId, userId, fullName, newRole });
};

export const emitSystemMessage = (groupId: string, content: string): void => {
  socketServer?.to(`group:${groupId}`).emit('system:message', { content, groupId, createdAt: new Date() });
};

// Define allowed socket events for type safety
type AllowedSocketEvents = keyof import('./types').ServerToClientEvents;

export const emitToUser = (userId: number, event: AllowedSocketEvents, data: any): void => {
  socketServer?.to(`user:${userId}`).emit(event, data);
};

// Helper methods - Use crypto.randomUUID() for better uniqueness
export const sendSystemMessage = (groupId: string, content: string): void => {
  const systemMessage: SystemMessage = {
    id: `system-${randomUUID()}`,
    content,
    type: 'ANNOUNCEMENT',
    groupId,
    senderId: null,
    createdAt: new Date(),
    sender: {
      id: null,
      fullName: 'System',
      profileUrl: null
    }
  };

  emitNewMessage(groupId, systemMessage);
};

export const notifyMemberJoined = (groupId: string, memberName: string): void => {
  sendSystemMessage(groupId, `${memberName} joined the group`);
};

export const notifyMemberLeft = (groupId: string, memberName: string): void => {
  sendSystemMessage(groupId, `${memberName} left the group`);
};