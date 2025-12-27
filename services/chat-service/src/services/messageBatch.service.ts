import prisma from '../db';
import { MessageType } from '@prisma/client';

export interface BulkMessageData {
  id: string;
  content?: string | undefined;
  type: MessageType;
  fileUrl?: string | undefined;
  groupId: string;
  senderId: number;
  replyToId?: string | undefined;
  createdAt: Date;
}

export class MessageBatchService {
  static async bulkCreateMessages(messages: BulkMessageData[]): Promise<void> {
    if (messages.length === 0) return;

    try {
      await prisma.message.createMany({
        data: messages.map(msg => ({
          id: msg.id,
          content: msg.content ?? null,
          type: msg.type,
          fileUrl: msg.fileUrl ?? null,
          groupId: msg.groupId,
          senderId: msg.senderId,
          replyToId: msg.replyToId ?? null,
          createdAt: msg.createdAt
        })),
        skipDuplicates: true
      });

      await this.bulkCreateMessageStatuses(messages);
    } catch (error) {
      console.error('❌ Bulk message creation failed:', error);
      throw error;
    }
  }

  private static async bulkCreateMessageStatuses(messages: BulkMessageData[]): Promise<void> {
    try {
      const statusData: Array<{
        messageId: string;
        userId: number;
        status: 'SENT' | 'DELIVERED';
      }> = [];

      for (const message of messages) {
        const members = await prisma.groupMember.findMany({
          where: { groupId: message.groupId },
          select: { userId: true }
        });

        for (const member of members) {
          statusData.push({
            messageId: message.id,
            userId: member.userId,
            status: member.userId === message.senderId ? 'SENT' : 'DELIVERED'
          });
        }
      }

      if (statusData.length > 0) {
        await prisma.messageStatus.createMany({
          data: statusData,
          skipDuplicates: true
        });
      }
    } catch (error) {
      console.error('Bulk message status creation failed:', error);
    }
  }
}