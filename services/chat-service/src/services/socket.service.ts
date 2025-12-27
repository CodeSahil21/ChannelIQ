import prisma from "../db";
import { MessageType, DeliveryStatus } from "@prisma/client";
import { CacheService, CacheKeys } from '../utils/cache';

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

    this.createMessageStatusAsync(message.id, data.groupId, data.senderId);
    return message;
  }

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

  static async updateMessageWithAuth(messageId: string, userId: number, content: string) {
    const updated = await prisma.message.updateMany({
      where: { id: messageId, senderId: userId },
      data: { content, updatedAt: new Date() }
    });
    
    if (updated.count === 0) throw new Error("Message not found or unauthorized");
    
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { groupId: true }
    });
    
    return { groupId: message!.groupId, updatedAt: new Date() };
  }

  static async deleteMessageWithAuth(messageId: string, userId: number) {
    const updated = await prisma.message.updateMany({
      where: { id: messageId, senderId: userId },
      data: { isDeleted: true, updatedAt: new Date() }
    });
    
    if (updated.count === 0) throw new Error("Message not found or unauthorized");
    
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { groupId: true }
    });
    
    return { groupId: message!.groupId, updatedAt: new Date() };
  }

  static async updateMessageStatus(messageId: string, userId: number, status: DeliveryStatus) {
    return prisma.messageStatus.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { status },
      create: { messageId, userId, status }
    });
  }

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

  static async handlePollVoteOptimized(userId: number, pollId: string, optionId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        allowMultiple: true,
        options: { 
          select: { 
            id: true,
            _count: { select: { votes: true } },
            votes: { where: { userId }, select: { id: true } }
          } 
        },
        message: {
          select: {
            groupId: true,
            group: {
              select: {
                members: {
                  where: { userId },
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    if (!poll) throw new Error('Poll not found');
    if (!poll.message.group.members[0]) throw new Error('Not a group member');

    const updatedOptions = [];

    if (!poll.allowMultiple) {
      await prisma.$transaction(async (tx) => {
        await tx.pollVote.deleteMany({
          where: { userId, option: { pollId } }
        });
        await tx.pollVote.create({
          data: { userId, optionId }
        });
      });

      for (const option of poll.options) {
        let voteCount = option._count.votes;
        const hadVote = option.votes.length > 0;
        
        if (option.id === optionId) {
          voteCount = hadVote ? voteCount : voteCount + 1;
        } else if (hadVote) {
          voteCount = voteCount - 1;
        }
        
        updatedOptions.push({
          optionId: option.id,
          voteCount,
          hasVoted: option.id === optionId
        });
      }
    } else {
      const targetOption = poll.options.find(o => o.id === optionId);
      if (!targetOption) throw new Error('Poll option not found');
      
      const hasVoted = targetOption.votes.length > 0;
      
      if (hasVoted) {
        await prisma.pollVote.delete({
          where: { userId_optionId: { userId, optionId } }
        });
      } else {
        await prisma.pollVote.create({
          data: { userId, optionId }
        });
      }

      const currentCount = targetOption._count.votes;
      updatedOptions.push({
        optionId,
        voteCount: hasVoted ? currentCount - 1 : currentCount + 1,
        hasVoted: !hasVoted
      });
    }

    return {
      groupId: poll.message.groupId,
      updatedOptions
    };
  }

  static async getUserById(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        profileUrl: true
      }
    });
  }

  static async verifyGroupMember(userId: number, groupId: string) {
    const cacheKey = CacheKeys.membership(userId, groupId);
    
    try {
      const cached = await CacheService.get<string>(cacheKey);
      if (cached === 'true') {
        return { userId, groupId };
      }
      if (cached === 'false') {
        throw new Error("Not a group member");
      }
    } catch (redisError) {
      // Continue to DB if Redis fails
    }

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
      select: { userId: true, groupId: true }
    });
    
    if (!member) {
      try {
        await CacheService.set(cacheKey, 'false', 300);
      } catch {}
      throw new Error("Not a group member");
    }

    try {
      await CacheService.set(cacheKey, 'true', 1800);
    } catch {}
    
    return member;
  }
}

// Socket server management for Kafka consumer
let socketServer: any = null;

export const setSocketServer = (io: any) => {
  socketServer = io;
};

export const getSocketServer = () => {
  return socketServer;
};