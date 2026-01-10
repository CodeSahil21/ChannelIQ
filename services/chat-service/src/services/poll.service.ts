import prisma from '../db';
import { MessageType, GroupRole } from '@prisma/client';
import { 
  CreatePollInput,
  CreatePollResponse,
  GetPollResponse,
  DeletePollResponse,
  Poll
} from '../utils/types';
import { ValidationError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { CacheService} from '../utils/cache';

export class PollService {
  static async createPoll(
    groupId: string,
    userId: number,
    input: CreatePollInput
  ): Promise<CreatePollResponse> {
    const { question, options, allowMultiple = false, expiresAt } = input;

    if (options.length < 2) {
      throw new ValidationError('Poll must have at least 2 options');
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    if (!group.members[0]) {
      throw new UnauthorizedError('You are not a member of this group');
    }

    const message = await prisma.message.create({
      data: {
        groupId,
        senderId: userId,
        type: MessageType.POLL,
        content: question,
        poll: {
          create: {
            question,
            allowMultiple,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            options: {
              create: options.map(text => ({ text }))
            }
          }
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profileUrl: true,
          },
        },
        poll: {
          include: {
            options: {
              include: {
                _count: { select: { votes: true } }
              }
            }
          }
        }
      },
    });

    await CacheService.deletePattern(`chat:polls:${groupId}`);

    return {
      ...message,
      poll: {
        ...message.poll!,
        options: message.poll!.options.map(option => ({
          id: option.id,
          text: option.text,
          voteCount: option._count.votes,
          hasVoted: false
        }))
      }
    } as CreatePollResponse;
  }

  static async getPoll(messageId: string, userId: number): Promise<GetPollResponse> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        group: {
          select: {
            members: {
              where: { userId },
              select: { id: true }
            }
          }
        },
        poll: {
          include: {
            options: {
              include: {
                _count: { select: { votes: true } },
                votes: {
                  where: { userId },
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    if (!message || !message.poll) {
      throw new NotFoundError('Poll not found');
    }

    if (!message.group.members[0]) {
      throw new UnauthorizedError('You are not a member of this group');
    }

    return {
      id: message.poll.id,
      question: message.poll.question,
      allowMultiple: message.poll.allowMultiple,
      expiresAt: message.poll.expiresAt,
      messageId: message.id,
      options: message.poll.options.map(option => ({
        id: option.id,
        text: option.text,
        voteCount: option._count.votes,
        hasVoted: option.votes.length > 0
      }))
    };
  }

  static async getPolls(groupId: string, userId: number): Promise<Poll[]> {
    const polls = await prisma.message.findMany({
      where: {
        groupId,
        type: MessageType.POLL,
        group: {
          members: {
            some: { userId }
          }
        }
      },
      select: {
        id: true,
        groupId: true,
        senderId: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profileUrl: true,
          },
        },
        poll: {
          select: {
            id: true,
            question: true,
            allowMultiple: true,
            expiresAt: true,
            options: {
              select: {
                id: true,
                text: true,
                _count: { select: { votes: true } },
                votes: {
                  where: { userId },
                  select: { id: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return polls.map(message => ({
      id: (message as any).poll!.id,
      messageId: message.id,
      question: (message as any).poll!.question,
      allowMultiple: (message as any).poll!.allowMultiple,
      expiresAt: (message as any).poll!.expiresAt,
      createdAt: message.createdAt,
      createdBy: (message as any).sender,
      options: (message as any).poll!.options.map((option: any) => ({
        id: option.id,
        text: option.text,
        votes: option._count.votes,
        hasVoted: option.votes.length > 0
      }))
    }));
  }

  static async deletePoll(messageId: string, userId: number): Promise<DeletePollResponse> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        group: {
          select: {
            id: true,
            members: {
              where: { userId },
              select: { role: true }
            }
          }
        },
        poll: { select: { id: true } }
      }
    });

    if (!message || !message.poll) {
      throw new NotFoundError('Poll not found');
    }

    const membership = message.group.members[0];
    if (!membership) {
      throw new UnauthorizedError('You are not a member of this group');
    }

    if (message.senderId !== userId && membership.role !== GroupRole.ADMIN && membership.role !== GroupRole.CO_ADMIN) {
      throw new UnauthorizedError('Only poll creator or admins can delete polls');
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    await CacheService.deletePattern(`chat:polls:${message.group.id}`);

    return {
      success: true,
      message: 'Poll deleted successfully',
      poll: {
        message: {
          groupId: message.group.id
        }
      }
    };
  }
}