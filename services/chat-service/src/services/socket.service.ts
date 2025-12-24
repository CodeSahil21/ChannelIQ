import prisma from "../db";
import { MessageType, DeliveryStatus } from "@prisma/client";
import { redis } from "../redis";

export class SocketMessageService {
  // Message Operations
  static async createMessage(data: {
    content?: string;
    type: MessageType;
    fileUrl?: string;
    groupId: string;
    senderId: number;
    replyToId?: string;
  }) {
    // Fast message creation without MessageStatus
    const message = await prisma.message.create({
      data: {
        content: data.content ?? null,
        type: data.type,
        fileUrl: data.fileUrl ?? null,
        groupId: data.groupId,
        senderId: data.senderId,
        replyToId: data.replyToId ?? null
      },
      include: {
        sender: true
      }
    });

    // Create MessageStatus asynchronously (non-blocking)
    this.createMessageStatusAsync(message.id, data.groupId, data.senderId);

    return message;
  }

  // Async MessageStatus creation (background)
  private static async createMessageStatusAsync(messageId: string, groupId: string, senderId: number) {
    try {
      const members = await prisma.groupMember.findMany({
        where: { groupId },
        select: { userId: true }
      });

      const statusData = members.map(({ userId }) => ({
        messageId,
        userId,
        status: userId === senderId ? "SENT" as const : "DELIVERED" as const
      }));

      await prisma.messageStatus.createMany({
        data: statusData,
        skipDuplicates: true
      });
    } catch (error) {
      console.error('Background MessageStatus creation failed:', error);
    }
  }

  static async findMessageWithAuth(messageId: string, userId: number) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true, groupId: true }
    });
    
    if (!message) throw new Error("Message not found");
    if (message.senderId !== userId) throw new Error("Unauthorized");
    
    return message;
  }

  static async updateMessage(messageId: string, content: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: { content, updatedAt: new Date() }
    });
  }

  static async deleteMessage(messageId: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, updatedAt: new Date() }
    });
  }

  // Message Status
  static async updateMessageStatus(messageId: string, userId: number, status: DeliveryStatus) {
    return prisma.messageStatus.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { status },
      create: { messageId, userId, status }
    });
  }

  // Reactions
  static async addReaction(messageId: string, userId: number, emoji: string) {
    return prisma.messageReaction.create({
      data: { messageId, userId, emoji }
    });
  }

  static async removeReaction(messageId: string, userId: number, emoji: string) {
    return prisma.messageReaction.delete({
      where: { messageId_userId_emoji: { messageId, userId, emoji } }
    });
  }

  static async findMessageForReaction(messageId: string) {
    return prisma.message.findUnique({
      where: { id: messageId },
      select: { groupId: true }
    });
  }

  // Poll Operations
  static async findPoll(pollId: string) {
    return prisma.poll.findUnique({
      where: { id: pollId },
      include: { message: { select: { groupId: true } } }
    });
  }

  static async createPollVote(userId: number, optionId: string) {
    return prisma.pollVote.create({
      data: { userId, optionId }
    });
  }

  static async countPollVotes(optionId: string) {
    return prisma.pollVote.count({
      where: { optionId }
    });
  }

  // Group Membership with Redis caching
  static async verifyGroupMember(userId: number, groupId: string) {
    const cacheKey = `membership:${userId}:${groupId}`;
    
    try {
      // Check Redis cache first
      const cached = await redis.get(cacheKey);
      if (cached === 'true') {
        return { userId, groupId }; // Return minimal object
      }
      if (cached === 'false') {
        throw new Error("Not a group member");
      }
    } catch (redisError) {
      // Continue to DB if Redis fails
    }

    // Fallback to database
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
      select: { userId: true, groupId: true }
    });
    
    if (!member) {
      // Cache negative result for 5 minutes
      try {
        await redis.setEx(cacheKey, 300, 'false');
      } catch {}
      throw new Error("Not a group member");
    }

    // Cache positive result for 30 minutes
    try {
      await redis.setEx(cacheKey, 1800, 'true');
    } catch {}
    
    return member;
  }
}