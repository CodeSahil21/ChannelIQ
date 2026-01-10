import prisma from '../db';
import { GroupRole, MessageType } from '@prisma/client';
import {
  GroupResponse,
  CreateGroupInput,
  MyGroupsResponse,
  GroupDetailResponse,
  SearchGroupsResponse,
  PublicGroupItem,
  UpdateGroupInput,
  UpdateGroupResponse,
  DeleteGroupResponse,
  PinMessageResponse,
  UnpinMessageResponse,
  PinnedMessagesResponse,
  CreateAnnouncementInput,
  CreateAnnouncementResponse,
  GetAnnouncementsListResponse
} from '../utils/types';
import { NotFoundError, UnauthorizedError, ConflictError, ForbiddenError } from '../utils/errors';
import { CacheService, CacheKeys } from '../utils/cache';
import { config } from '../utils/config';
import { MemberService } from './member.service';
import { RequestService } from './request.service';
import { PollService } from './poll.service';

// Re-export functions for backward compatibility
export const getGroupMembers = MemberService.getGroupMembers;
export const inviteUserToGroup = MemberService.inviteUser;
export const removeMember = MemberService.removeMember;
export const updateMemberRole = MemberService.updateMemberRole;
export const updateMemberSettings = MemberService.updateMemberSettings;
export const joinGroupRequest = RequestService.joinGroup;
export const getPendingRequests = RequestService.getPendingRequests;
export const respondToRequest = RequestService.respondToRequest;
export const createPoll = PollService.createPoll;
export const getPoll = PollService.getPoll;
export const getPolls = PollService.getPolls;
export const deletePoll = PollService.deletePoll;



export const CreateGroup = async (input: CreateGroupInput, creatorId: number): Promise<GroupResponse> => {
  const {
    name,
    description,
    isPrivate = false,
    imageUrl,
    maxMembers = 256
  } = input;

  const group = await prisma.group.create({
    data: {
      name,
      description: description || null,
      isPrivate,
      imageUrl: imageUrl || null,
      maxMembers,
      creatorId,
      members: {
        create: {
          userId: creatorId,
          role: GroupRole.ADMIN,
        },
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          fullName: true,
          profileUrl: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              profileUrl: true,
            },
          },
        },
      },
    },
  });

  // Invalidate cache (non-blocking)
  await CacheService.deletePattern(`chat:user:${creatorId}:*`);
  await CacheService.deletePattern('chat:search:*');

  return group as GroupResponse;
};

export const getMyGroups = async (userId: number): Promise<MyGroupsResponse> => {
  const cacheKey = CacheKeys.userGroups(userId);
  const cached = await CacheService.get<MyGroupsResponse>(cacheKey);
  if (cached) return cached;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      groupId: true,
      role: true,
      isMuted: true,
      joinedAt: true,
      group: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          isPrivate: true,
          creatorId: true,
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
    take: 20,
  });
  
  const result = memberships as MyGroupsResponse;
  await CacheService.set(cacheKey, result, config.CACHE_TTL.LONG); 
  return result;
};

export const getGroupDetails = async (groupId: string, userId: number): Promise<GroupDetailResponse | null> => {
  const cacheKey = CacheKeys.group(groupId);
  const cached = await CacheService.get<GroupDetailResponse>(cacheKey);
  if (cached) return cached;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      isPrivate: true,
      maxMembers: true,
      creatorId: true,
      createdAt: true,
      creator: {
        select: {
          id: true,
          fullName: true,
          profileUrl: true,
        },
      },
      members: {
        select: {
          id: true,
          userId: true,
          role: true,
          isMuted: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              profileUrl: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
        take: 50,
      },
      _count: { select: { members: true } },
    },
  });

  if (!group) throw new NotFoundError('Group not found');

  const membership = (group as any).members?.find((m: any) => m.userId === userId);
  if (!membership && group.isPrivate) {
    throw new ForbiddenError('You do not have access to this private group');
  }

  const result = group as GroupDetailResponse;
  await CacheService.set(cacheKey, result, config.CACHE_TTL.LONG);
  return result;
};

export const searchGroups = async (  
  query: string,
  page: number = 1,
  limit: number = 20): Promise<SearchGroupsResponse> => {
  const cacheKey = CacheKeys.groupSearch(query, page);
  const cached = await CacheService.get<SearchGroupsResponse>(cacheKey);
  if (cached) return cached;

  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, 10);
  const groups = await prisma.group.findMany({
    where: {
      isPrivate: false,
      name: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      maxMembers: true,
      createdAt: true,
      creator: {
        select: {
          id: true,
          fullName: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: [
      { members: { _count: 'desc' } },
      { createdAt: 'desc' },
    ],
    take: safeLimit,
    skip,
  });

  const result = {
    groups: groups as PublicGroupItem[],
    pagination: {
      page,
      limit: safeLimit,
      total: 0,
      totalPages: 0,
    },
  };
  
  await CacheService.set(cacheKey, result, config.CACHE_TTL.SEARCH);
  return result;
};

export const updateGroup = async (
  groupId: string,
  userId: number,
  input: UpdateGroupInput
): Promise<UpdateGroupResponse> => {
  const result = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId },
        select: { role: true }
      }
    }
  });

  if (!result) throw new Error('Group not found');
  
  const membership = result.members[0];
  if (!membership) throw new Error('You are not a member of this group');
  
  if (membership.role !== GroupRole.ADMIN && membership.role !== GroupRole.CO_ADMIN) {
    throw new Error('Only admins can update group information');
  }

  if (input.maxMembers !== undefined) {
    if (input.maxMembers < 2) {
      throw new Error('Maximum members must be at least 2');
    }
    if (input.maxMembers < result._count.members) {
      throw new Error(
        `Cannot reduce max members below current member count (${result._count.members})`
      );
    }
  }

  const updateData: Partial<UpdateGroupInput> = {};
  
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
  if (input.isPrivate !== undefined) updateData.isPrivate = input.isPrivate;
  if (input.maxMembers !== undefined) updateData.maxMembers = input.maxMembers;

  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: updateData,
  });
  
  await CacheService.deletePatterns([
    `chat:group:${groupId}`,
    'chat:search:*'
  ]);
  
  return updatedGroup as UpdateGroupResponse;
};



export const deleteGroup = async (
  groupId: string,
  userId: number
): Promise<DeleteGroupResponse> => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  if (group.creatorId !== userId) {
    throw new Error('Only the group creator can delete the group');
  }

  const deletedGroup = await prisma.group.delete({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      creatorId: true,
    },
  });

  await CacheService.deletePatterns([
    `chat:group:${groupId}`,
    `chat:members:${groupId}`,
    `chat:pinned:${groupId}`,
    `chat:user:*:groups`,
    'chat:search:*'
  ]);

  return {
    success: true,
    message: 'Group deleted successfully',
    deletedGroup,
  };
};

export const pinMessage = async (
  groupId: string,
  messageId: string,
  userId: number
): Promise<PinMessageResponse> => {
  const [messageData, existingPin, pinnedCount] = await Promise.all([
    prisma.message.findUnique({
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
        }
      }
    }),
    prisma.pinnedMessage.findUnique({
      where: { messageId },
      select: { id: true }
    }),
    prisma.pinnedMessage.count({
      where: { groupId }
    })
  ]);

  if (!messageData || messageData.groupId !== groupId) {
    throw new NotFoundError('Message not found in this group');
  }

  const membership = messageData.group.members[0];
  if (!membership || (membership.role !== GroupRole.ADMIN && membership.role !== GroupRole.CO_ADMIN)) {
    throw new UnauthorizedError('Only admins can pin messages');
  }

  if (existingPin) {
    throw new ConflictError('Message is already pinned');
  }

  if (pinnedCount >= 4) {
    throw new ConflictError('Maximum of 4 messages can be pinned per group');
  }

  const pinnedMessage = await prisma.pinnedMessage.create({
    data: {
      groupId,
      messageId,
      pinnedBy: userId,
    },
    include: {
      message: {
        select: {
          id: true,
          content: true,
          type: true,
          senderId: true,
          createdAt: true,
        },
      },
    },
  });

  await CacheService.deletePattern(`chat:pinned:${groupId}`);

  return {
    ...pinnedMessage,
    pinnedById: pinnedMessage.pinnedBy,
  } as PinMessageResponse;
};

export const unpinMessage = async (
  groupId: string,
  messageId: string,
  userId: number
): Promise<UnpinMessageResponse> => {
  const pinnedMessage = await prisma.pinnedMessage.findUnique({
    where: { messageId },
    include: {
      group: {
        select: {
          members: {
            where: { userId },
            select: { role: true }
          }
        }
      }
    }
  });

  if (!pinnedMessage) {
    throw new Error('Message is not pinned');
  }

  const membership = pinnedMessage.group.members[0];
  if (!membership || (membership.role !== GroupRole.ADMIN && membership.role !== GroupRole.CO_ADMIN)) {
    throw new Error('Only admins can unpin messages');
  }

  await prisma.pinnedMessage.delete({
    where: { messageId }
  });

  await CacheService.deletePattern(`chat:pinned:${groupId}`);

  return {
    success: true,
    message: 'Message unpinned successfully',
  };
};  

export const getPinnedMessages = async (
  groupId: string,
  userId: number
): Promise<PinnedMessagesResponse> => {
  const cacheKey = CacheKeys.pinnedMessages(groupId);
  const cached = await CacheService.get<PinnedMessagesResponse>(cacheKey);
  if (cached) return cached;

  const pinnedMessages = await prisma.pinnedMessage.findMany({
    where: {
      groupId,
      group: {
        members: {
          some: { userId },
        },
      },
    },
    select: {
      id: true,
      groupId: true,
      messageId: true,
      pinnedBy: true,
      pinnedAt: true,
      message: {
        select: {
          id: true,
          content: true,
          type: true,
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
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          profileUrl: true,
        },
      },
    },
    orderBy: { pinnedAt: 'desc' },
  });

  if (pinnedMessages.length === 0) {
    const groupExists = await prisma.group.findUnique({
      where: {
        id: groupId,
        members: {
          some: { userId }
        }
      },
      select: { id: true }
    });
    
    if (!groupExists) {
      throw new UnauthorizedError('You are not a member of this group');
    }
  }

  const result = pinnedMessages.map((pm: any) => ({
    ...pm,
    pinnedById: pm.pinnedBy,
    pinnedBy: pm.user,
    message: pm.message,
  }));
  
  await CacheService.set(cacheKey, result, config.CACHE_TTL.MEDIUM);
  return result;
};  

export const createAnnouncement = async (
  groupId: string,
  userId: number,
  input: CreateAnnouncementInput
): Promise<CreateAnnouncementResponse> => {
  const { title, content } = input;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { userId },
        select: { role: true }
      }
    }
  });

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  const membership = group.members[0];
  if (!membership || (membership.role !== GroupRole.ADMIN && membership.role !== GroupRole.CO_ADMIN)) {
    throw new UnauthorizedError('Only admins can create announcements');
  }

  const announcement = await prisma.message.create({
    data: {
      groupId,
      senderId: userId,
      type: MessageType.ANNOUNCEMENT,
      content: `${title}: ${content}`,
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
    },
  });

  await CacheService.deletePattern(`chat:announcements:${groupId}`);

  return {
    ...announcement,
    metadata: {
      title,
      isAnnouncement: true,
    },
  } as CreateAnnouncementResponse;
};

export const getAnnouncements = async (
  groupId: string,
  userId: number
): Promise<GetAnnouncementsListResponse> => {
  const cacheKey = CacheKeys.announcements(groupId);
  const cached = await CacheService.get<GetAnnouncementsListResponse>(cacheKey);
  if (cached) return cached;

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const announcements = await prisma.message.findMany({
    where: {
      groupId,
      type: MessageType.ANNOUNCEMENT,
      createdAt: {
        gte: fiveDaysAgo
      },
      group: {
        members: {
          some: { userId }
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
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = announcements.map(announcement => ({
    ...announcement,
    metadata: {
      title: announcement.content?.split(': ')[0] || 'Announcement',
      isAnnouncement: true,
    },
  })) as unknown as GetAnnouncementsListResponse;

  await CacheService.set(cacheKey, result, config.CACHE_TTL.MEDIUM);
  return result;
};

export const updateGroupProfileImage = async (
  groupId: string,
  userId: number,
  imageUrl: string | null
): Promise<void> => {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!membership) {
    throw new UnauthorizedError('You are not a member of this group');
  }

  if (membership.role !== GroupRole.ADMIN && membership.role !== GroupRole.CO_ADMIN) {
    throw new UnauthorizedError('Only admins can update group profile image');
  }

  await prisma.group.update({
    where: { id: groupId },
    data: { imageUrl },
  });

  await CacheService.deletePatterns([
    `chat:group:${groupId}`,
    'chat:search:*'
  ]);
};

export const votePoll = async (
  pollId: string,
  optionId: string,
  userId: number
): Promise<{ groupId: string; voteCount: number }> => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
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
      },
      options: {
        where: { id: optionId },
        select: { id: true }
      }
    }
  });

  if (!poll) {
    throw new NotFoundError('Poll not found');
  }

  if (!poll.message.group.members[0]) {
    throw new UnauthorizedError('You are not a member of this group');
  }

  if (poll.options.length === 0) {
    throw new NotFoundError('Poll option not found');
  }

  if (poll.expiresAt && poll.expiresAt < new Date()) {
    throw new ConflictError('Poll has expired');
  }

  // Check if user already voted on this poll
  if (!poll.allowMultiple) {
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        userId,
        option: {
          pollId
        }
      }
    });

    if (existingVote) {
      throw new ConflictError('You have already voted on this poll');
    }
  }

  // Create the vote
  await prisma.pollVote.create({
    data: {
      userId,
      optionId
    }
  });

  // Get updated vote count
  const voteCount = await prisma.pollVote.count({
    where: { optionId }
  });

  // Invalidate polls cache to refresh vote counts
  await CacheService.deletePattern(`chat:polls:${poll.message.groupId}`);

  return {
    groupId: poll.message.groupId,
    voteCount
  };
};