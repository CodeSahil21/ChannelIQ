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

  static async updateMessageWithAuth(messageId: string, userId: number, content: string) {
    // Single atomic operation with auth check
    const updated = await prisma.message.updateMany({
      where: { id: messageId, senderId: userId },
      data: { content, updatedAt: new Date() }
    });
    
    if (updated.count === 0) throw new Error("Message not found or unauthorized");
    
    // Get groupId in separate minimal query
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { groupId: true }
    });
    
    return { groupId: message!.groupId, updatedAt: new Date() };
  }

  static async deleteMessage(messageId: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, updatedAt: new Date() }
    });
  }

  static async deleteMessageWithAuth(messageId: string, userId: number) {
    // Single atomic operation with auth check
    const updated = await prisma.message.updateMany({
      where: { id: messageId, senderId: userId },
      data: { isDeleted: true, updatedAt: new Date() }
    });
    
    if (updated.count === 0) throw new Error("Message not found or unauthorized");
    
    // Get groupId in separate minimal query
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { groupId: true }
    });
    
    return { groupId: message!.groupId, updatedAt: new Date() };
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

  static async handlePollVote(userId: number, pollId: string, optionId: string) {
    // Get poll details to check if it allows multiple votes
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { allowMultiple: true, options: { select: { id: true } } }
    });

    if (!poll) throw new Error('Poll not found');

    const updatedOptions = [];

    if (!poll.allowMultiple) {
      // For single-choice polls, remove existing vote and add new one
      await prisma.$transaction(async (tx) => {
        // Remove existing vote for this user on this poll
        await tx.pollVote.deleteMany({
          where: {
            userId,
            option: { pollId }
          }
        });

        // Add new vote
        await tx.pollVote.create({
          data: { userId, optionId }
        });
      });

      // Get updated counts for all options
      for (const option of poll.options) {
        const voteCount = await this.countPollVotes(option.id);
        updatedOptions.push({
          optionId: option.id,
          voteCount,
          hasVoted: option.id === optionId
        });
      }
    } else {
      // For multiple-choice polls, toggle the vote
      const existingVote = await prisma.pollVote.findUnique({
        where: { userId_optionId: { userId, optionId } }
      });

      if (existingVote) {
        await prisma.pollVote.delete({
          where: { userId_optionId: { userId, optionId } }
        });
      } else {
        await prisma.pollVote.create({
          data: { userId, optionId }
        });
      }

      const voteCount = await this.countPollVotes(optionId);
      updatedOptions.push({
        optionId,
        voteCount,
        hasVoted: !existingVote
      });
    }

    return updatedOptions;
  }

  static async handlePollVoteOptimized(userId: number, pollId: string, optionId: string) {
    // Single query with all needed data including vote counts
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
      // For single-choice polls, remove existing vote and add new one
      await prisma.$transaction(async (tx) => {
        await tx.pollVote.deleteMany({
          where: { userId, option: { pollId } }
        });
        await tx.pollVote.create({
          data: { userId, optionId }
        });
      });

      // Use pre-fetched counts and adjust for the vote change
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
      // For multiple-choice polls, toggle the vote
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
// Socket server management for Kafka consumer
let socketServer: any = null;

export const setSocketServer = (io: any) => {
  socketServer = io;
};

export const getSocketServer = () => {
  return socketServer;
};