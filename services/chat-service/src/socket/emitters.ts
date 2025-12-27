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

export class SocketEmitter {
  static emitNewMessage(groupId: string, message: MessageWithRelations | SystemMessage): void {
    socketServer?.to(`group:${groupId}`).emit('message:persisted', message);
  }

  static emitMessageRead(groupId: string, messageId: string, userId: number): void {
    socketServer?.to(`group:${groupId}`).emit('message:read', { messageId, userId });
  }

  static emitMessageDelivered(groupId: string, messageId: string, userId: number): void {
    socketServer?.to(`group:${groupId}`).emit('message:delivered', { messageId, userId });
  }

  static emitMessageUpdated(groupId: string, messageId: string, content?: string, isDeleted: boolean = false): void {
    const payload: { messageId: string; isDeleted: boolean; updatedAt: Date; content?: string } = {
      messageId,
      isDeleted,
      updatedAt: new Date()
    };
    
    if (content !== undefined) {
      payload.content = content;
    }
    
    socketServer?.to(`group:${groupId}`).emit('message:updated', payload);
  }

  static emitReactionUpdate(groupId: string, messageId: string, emoji: string, userId: number, action: 'add' | 'remove'): void {
    socketServer?.to(`group:${groupId}`).emit('reaction:updated', { messageId, emoji, userId, action });
  }

  static emitTypingUpdate(groupId: string, userId: number, isTyping: boolean, fullName: string): void {
    socketServer?.to(`group:${groupId}`).emit('typing:updated', { groupId, userId, isTyping, fullName });
  }

  static emitPollVoteUpdate(groupId: string, pollId: string, optionId: string, userId: number, voteCount: number): void {
    socketServer?.to(`group:${groupId}`).emit('poll:vote:update', { pollId, optionId, userId, voteCount });
  }

  static emitUserStatusUpdate(userId: number, status: 'online' | 'offline', lastSeen?: Date): void {
    const payload: { userId: number; status: 'online' | 'offline'; lastSeen?: Date } = { userId, status };
    
    if (lastSeen !== undefined) {
      payload.lastSeen = lastSeen;
    }
    
    socketServer?.emit('user:status', payload);
  }

  static emitGroupMemberAdded(groupId: string, userId: number, fullName: string, role: GroupRole): void {
    socketServer?.to(`group:${groupId}`).emit('group:member:added', { groupId, userId, fullName, role });
  }

  static emitGroupMemberRemoved(groupId: string, userId: number, fullName: string): void {
    socketServer?.to(`group:${groupId}`).emit('group:member:removed', { groupId, userId, fullName });
  }

  static emitGroupMemberRoleUpdated(groupId: string, userId: number, fullName: string, newRole: GroupRole): void {
    socketServer?.to(`group:${groupId}`).emit('group:member:role:updated', { groupId, userId, fullName, newRole });
  }

  static emitSystemMessage(groupId: string, content: string): void {
    socketServer?.to(`group:${groupId}`).emit('system:message', { content, groupId, createdAt: new Date() });
  }

  static emitAnnouncementCreated(groupId: string, messageId: string, content: string, createdBy: string): void {
    socketServer?.to(`group:${groupId}`).emit('announcement:created', { groupId, messageId, content, createdBy });
  }

  static emitPollCreated(groupId: string, messageId: string, question: string, createdBy: string): void {
    socketServer?.to(`group:${groupId}`).emit('poll:created', { groupId, messageId, question, createdBy });
  }

  static emitPollDeleted(groupId: string, messageId: string, deletedBy: string): void {
    socketServer?.to(`group:${groupId}`).emit('poll:deleted', { groupId, messageId, deletedBy });
  }

  static emitMessagePinned(groupId: string, messageId: string, pinnedBy: string): void {
    socketServer?.to(`group:${groupId}`).emit('message:pinned', { groupId, messageId, pinnedBy });
  }

  static emitMessageUnpinned(groupId: string, messageId: string, unpinnedBy: string): void {
    socketServer?.to(`group:${groupId}`).emit('message:unpinned', { groupId, messageId, unpinnedBy });
  }

  static sendSystemMessage(groupId: string, content: string): void {
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

    this.emitNewMessage(groupId, systemMessage);
  }

  static notifyMemberJoined(groupId: string, memberName: string): void {
    this.sendSystemMessage(groupId, `${memberName} joined the group`);
  }

  static notifyMemberLeft(groupId: string, memberName: string): void {
    this.sendSystemMessage(groupId, `${memberName} left the group`);
  }
}

// Backward compatibility exports
export const emitNewMessage = SocketEmitter.emitNewMessage;
export const emitMessageRead = SocketEmitter.emitMessageRead;
export const emitMessageDelivered = SocketEmitter.emitMessageDelivered;
export const emitMessageUpdated = SocketEmitter.emitMessageUpdated;
export const emitReactionUpdate = SocketEmitter.emitReactionUpdate;
export const emitTypingUpdate = SocketEmitter.emitTypingUpdate;
export const emitPollVoteUpdate = SocketEmitter.emitPollVoteUpdate;
export const emitUserStatusUpdate = SocketEmitter.emitUserStatusUpdate;
export const emitGroupMemberAdded = SocketEmitter.emitGroupMemberAdded;
export const emitGroupMemberRemoved = SocketEmitter.emitGroupMemberRemoved;
export const emitGroupMemberRoleUpdated = SocketEmitter.emitGroupMemberRoleUpdated;
export const emitSystemMessage = SocketEmitter.emitSystemMessage;
export const emitAnnouncementCreated = SocketEmitter.emitAnnouncementCreated;
export const emitPollCreated = SocketEmitter.emitPollCreated;
export const emitPollDeleted = SocketEmitter.emitPollDeleted;
export const emitMessagePinned = SocketEmitter.emitMessagePinned;
export const emitMessageUnpinned = SocketEmitter.emitMessageUnpinned;
export const sendSystemMessage = SocketEmitter.sendSystemMessage;
export const notifyMemberJoined = SocketEmitter.notifyMemberJoined;
export const notifyMemberLeft = SocketEmitter.notifyMemberLeft;