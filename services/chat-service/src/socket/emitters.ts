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
    const room = `group:${groupId}`;
    // Socket.io Redis adapter automatically handles cross-instance communication
    socketServer?.to(room).emit('message:persisted', message);
  }

  static emitMessageRead(groupId: string, messageId: string, userId: number): void {
    const room = `group:${groupId}`;
    const data = { messageId, userId };
    socketServer?.to(room).emit('message:read', data);
  }

  static emitMessageDelivered(groupId: string, messageId: string, userId: number): void {
    const room = `group:${groupId}`;
    const data = { messageId, userId };
    socketServer?.to(room).emit('message:delivered', data);
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
    
    const room = `group:${groupId}`;
    socketServer?.to(room).emit('message:updated', payload);
  }

  static emitReactionUpdate(groupId: string, messageId: string, emoji: string, userId: number, action: 'add' | 'remove'): void {
    const room = `group:${groupId}`;
    const data = { messageId, emoji, userId, action };
    socketServer?.to(room).emit('reaction:updated', data);
  }

  static emitTypingUpdate(groupId: string, userId: number, isTyping: boolean, fullName: string): void {
    const room = `group:${groupId}`;
    const data = { groupId, userId, isTyping, fullName };
    socketServer?.to(room).emit('typing:updated', data);
  }

  static emitPollVoteUpdate(groupId: string, pollId: string, optionId: string, userId: number, voteCount: number): void {
    const room = `group:${groupId}`;
    const data = { pollId, optionId, userId, voteCount };
    socketServer?.to(room).emit('poll:vote:update', data);
  }

  static emitUserStatusUpdate(userId: number, status: 'online' | 'offline', lastSeen?: Date): void {
    const payload: { userId: number; status: 'online' | 'offline'; lastSeen?: Date } = { userId, status };
    
    if (lastSeen !== undefined) {
      payload.lastSeen = lastSeen;
    }
    
    // Global broadcast - Redis adapter handles cross-instance
    socketServer?.emit('user:status', payload);
  }

  static emitGroupMemberAdded(groupId: string, userId: number, fullName: string, role: GroupRole): void {
    const room = `group:${groupId}`;
    const data = { groupId, userId, fullName, role };
    socketServer?.to(room).emit('group:member:added', data);
  }

  static emitGroupMemberRemoved(groupId: string, userId: number, fullName: string): void {
    const room = `group:${groupId}`;
    const data = { groupId, userId, fullName };
    socketServer?.to(room).emit('group:member:removed', data);
  }

  static emitGroupMemberRoleUpdated(groupId: string, userId: number, fullName: string, newRole: GroupRole): void {
    const room = `group:${groupId}`;
    const data = { groupId, userId, fullName, newRole };
    socketServer?.to(room).emit('group:member:role:updated', data);
  }

  static emitSystemMessage(groupId: string, content: string): void {
    const data = { content, groupId, createdAt: new Date() };
    socketServer?.to(`group:${groupId}`).emit('system:message', data);
  }

  static emitAnnouncementCreated(groupId: string, messageId: string, content: string, createdBy: string): void {
    const data = { groupId, messageId, content, createdBy };
    socketServer?.to(`group:${groupId}`).emit('announcement:created', data);
  }

  static emitPollCreated(groupId: string, messageId: string, question: string, createdBy: string): void {
    const data = { groupId, messageId, question, createdBy };
    socketServer?.to(`group:${groupId}`).emit('poll:created', data);
  }

  static emitPollDeleted(groupId: string, messageId: string, deletedBy: string): void {
    const data = { groupId, messageId, deletedBy };
    socketServer?.to(`group:${groupId}`).emit('poll:deleted', data);
  }

  static emitMessagePinned(groupId: string, messageId: string, pinnedBy: string): void {
    const data = { groupId, messageId, pinnedBy };
    socketServer?.to(`group:${groupId}`).emit('message:pinned', data);
  }

  static emitMessageUnpinned(groupId: string, messageId: string, unpinnedBy: string): void {
    const data = { groupId, messageId, unpinnedBy };
    socketServer?.to(`group:${groupId}`).emit('message:unpinned', data);
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