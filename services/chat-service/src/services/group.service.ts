import prisma from '../db';
import { GroupRole,RequestStatus,RequestType,MessageType } from '@prisma/client';
import {
  GroupResponse,
  CreateGroupInput,
  MyGroupsResponse,
  GroupDetailResponse,
  SearchGroupsResponse,
  PublicGroupItem,
  GroupMembersResponse,
  InviteUserInput,
  InviteUserResponse,
  JoinGroupResponse,
  PendingRequestsResponse,  
  RespondToRequestInput,
  RespondToRequestResponse,
  UpdateGroupInput,
  UpdateGroupResponse,
  RemoveMemberResponse, 
  DeleteGroupResponse,
  UpdateMemberRoleInput,
  UpdateMemberRoleResponse,
  UpdateMemberSettingsInput,
  UpdateMemberSettingsResponse,
  PinMessageResponse,
  UnpinMessageResponse,
  PinnedMessagesResponse,
  CreateAnnouncementInput,
  CreateAnnouncementResponse,
  GetAnnouncementsListResponse,
  CreatePollInput,
  CreatePollResponse,
  GetPollResponse,
  DeletePollResponse,  
  GroupWithMembershipAndRequests,
  RequestWithGroupAndMembers,
  GroupMemberWithRole,
  PendingRequestWithDetails,
  GroupWithMembersAndCount,
  GroupWithMembers        
} from '../utils/types';
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError, ForbiddenError } from '../utils/errors';
import { getCache, setCache, deleteCachePattern, deleteCachePatterns, CacheKeys, CacheTTL } from '../redis';

const cleanupPendingRequests = async (groupId: string, userId: number) => {
  return prisma.groupRequest.deleteMany({
    where: {
      groupId,
      OR: [
        { senderId: userId, status: RequestStatus.PENDING },
        { receiverId: userId, status: RequestStatus.PENDING }
      ]
    }
  });
};

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
  deleteCachePattern(`chat:user:${creatorId}:*`);
  deleteCachePattern('chat:search:*');

  return group as GroupResponse;
};

export const getMyGroups = async (userId: number): Promise<MyGroupsResponse> => {
  const cacheKey = CacheKeys.userGroups(userId);
  const cached = await getCache<MyGroupsResponse>(cacheKey);
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
  setCache(cacheKey, result, CacheTTL.LONG); 
  return result;
};

export const getGroupDetails = async (groupId: string, userId: number): Promise<GroupDetailResponse | null> => {
  const cacheKey = CacheKeys.group(groupId);
  const cached = await getCache<GroupDetailResponse>(cacheKey);
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

  const membership = group.members.find(m => m.userId === userId);
  if (!membership && group.isPrivate) {
    throw new ForbiddenError('You do not have access to this private group');
  }

  const result = group as GroupDetailResponse;
  setCache(cacheKey, result, CacheTTL.LONG); // Non-blocking
  return result;
};

export const searchGroups = async (  
  query: string,
  page: number = 1,
  limit: number = 20): Promise<SearchGroupsResponse> => {
  const cacheKey = CacheKeys.groupSearch(query, page);
  const cached = await getCache<SearchGroupsResponse>(cacheKey);
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
      total: 0, // Skip count for performance
      totalPages: 0,
    },
  };
  
  await setCache(cacheKey, result, CacheTTL.SEARCH);
  return result;
};      

export const getGroupMembers = async (groupId: string,userId: number): Promise<GroupMembersResponse> => {
  const cacheKey = CacheKeys.groupMembers(groupId);
  const cached = await getCache<GroupMembersResponse>(cacheKey);
  if (cached) {
    const isMember = cached.some(member => member.userId === userId);
    if (!isMember) throw new UnauthorizedError('You are not a member of this group');
    return cached;
  }

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: {
      id: true,
      userId: true,
      groupId: true,
      role: true,
      isMuted: true,
      muteUntil: true,
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
    orderBy: [
      { role: 'asc' },
      { joinedAt: 'asc' },
    ],
  });

  const isMember = members.some(member => member.userId === userId);
  if (!isMember) {
    throw new UnauthorizedError('You are not a member of this group');
  }

  const result = members as GroupMembersResponse;
  await setCache(cacheKey, result, CacheTTL.MEDIUM);
  return result;
};

type GroupWithMembersAndRequests = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  maxMembers: number;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    members: number;
  };
  members: {
    userId: number;
    role: GroupRole;
  }[];
  requests: {
    id: string;
  }[];
};

export const inviteUserToGroup = async (
  groupId: string,
  adminUserId: number,
  input: InviteUserInput
): Promise<InviteUserResponse> => {
  const { targetUserId, message } = input;
  const result = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: { select: { members: true } },
      members: {
        where: {
          OR: [
            { userId: adminUserId },
            { userId: targetUserId }
          ]
        },
        select: {
          userId: true,
          role: true
        }
      },
      requests: {
        where: {
          OR: [
            { receiverId: targetUserId, type: RequestType.INVITE, status: RequestStatus.PENDING },
            { senderId: targetUserId, type: RequestType.JOIN_REQUEST, status: RequestStatus.PENDING }
          ]
        },
        select: { id: true }
      }
    }
  }) as GroupWithMembersAndRequests | null;

  if (!result) throw new NotFoundError('Group not found');
  
  const adminMember = result.members.find(m => m.userId === adminUserId);
  const existingMember = result.members.find(m => m.userId === targetUserId);
  
  // Validation checks
  if (!adminMember || (adminMember.role !== GroupRole.ADMIN && adminMember.role !== GroupRole.CO_ADMIN)) {
    throw new UnauthorizedError('Only admins can invite users to the group');
  }
  if (existingMember) throw new ConflictError('User is already a member of this group');
  
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!targetUser) throw new NotFoundError('Target user not found');
  
  if (result._count.members >= result.maxMembers) throw new ConflictError('Group has reached maximum capacity');
  const [, invite] = await Promise.all([
    result.requests.length > 0 ? cleanupPendingRequests(groupId, targetUserId) : Promise.resolve(),
    prisma.groupRequest.create({
      data: {
        groupId,
        senderId: adminUserId,
        receiverId: targetUserId,
        type: RequestType.INVITE,
        status: RequestStatus.PENDING,
        message: message || null,
      },
    }),
  ]);
  deleteCachePatterns([
    `chat:user:${targetUserId}:requests`,
    `chat:user:${adminUserId}:requests`
  ]);

  return invite as InviteUserResponse;
};



export const joinGroupRequest = async (
  groupId: string,
  userId: number,
  message?: string
): Promise<JoinGroupResponse> => {
  const result = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId },
        select: { userId: true }
      },
      requests: {
        where: {
          OR: [
            { senderId: userId, type: RequestType.JOIN_REQUEST, status: RequestStatus.PENDING },
            { receiverId: userId, type: RequestType.INVITE, status: RequestStatus.PENDING }
          ]
        },
        select: { id: true }
      }
    }
  }) as GroupWithMembershipAndRequests | null;

  if (!result) throw new Error('Group not found');
  
  const existingMember = result.members.length > 0;
  if (existingMember) throw new Error('You are already a member of this group');
  
  if (result._count.members >= result.maxMembers) {
    throw new Error('Group has reached maximum capacity');
  }

  // Clean up and create request in parallel
  const [, request] = await Promise.all([
    result.requests.length > 0 ? cleanupPendingRequests(groupId, userId) : Promise.resolve(),
    prisma.groupRequest.create({
      data: {
        groupId,
        senderId: userId,
        receiverId: result.creatorId,
        type: RequestType.JOIN_REQUEST,
        status: RequestStatus.PENDING,
        message: message || null,
      },
    }),
  ]);

  return request as JoinGroupResponse;
};  

export const getPendingRequests = async (
  userId: number
): Promise<PendingRequestsResponse> => {
  const cacheKey = CacheKeys.pendingRequests(userId);
  const cached = await getCache<PendingRequestsResponse>(cacheKey);
  if (cached) return cached;

  // Split into 2 simple queries instead of complex OR
  const [invites, joinRequests] = await Promise.all([
    // Query 1: Direct invites to user
    prisma.groupRequest.findMany({
      where: {
        receiverId: userId,
        type: RequestType.INVITE,
        status: RequestStatus.PENDING,
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
        receiver: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profileUrl: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            isPrivate: true,
            creatorId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Query 2: Join requests for groups where user is admin
    prisma.groupRequest.findMany({
      where: {
        type: RequestType.JOIN_REQUEST,
        status: RequestStatus.PENDING,
        group: {
          members: {
            some: {
              userId,
              role: { in: [GroupRole.ADMIN, GroupRole.CO_ADMIN] },
            },
          },
        },
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
        receiver: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profileUrl: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            isPrivate: true,
            creatorId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const result = {
    invites: invites as PendingRequestWithDetails[],
    joinRequests: joinRequests as PendingRequestWithDetails[],
  };
  
  await setCache(cacheKey, result, CacheTTL.SHORT);
  return result;
};      


export const respondToRequest = async (
  requestId: string,
  userId: number,
  input: RespondToRequestInput
): Promise<RespondToRequestResponse> => {
  const { status } = input;

  if (status !== 'ACCEPTED' && status !== 'REJECTED') {
    throw new Error('Invalid status. Must be ACCEPTED or REJECTED');
  }

  // First get the request to determine target user
  const basicRequest = await prisma.groupRequest.findUnique({
    where: { id: requestId },
    select: { id: true, type: true, status: true, senderId: true, receiverId: true, groupId: true }
  });

  if (!basicRequest) throw new Error('Request not found');
  if (basicRequest.status !== RequestStatus.PENDING) {
    throw new Error('This request has already been processed');
  }

  const newMemberId = basicRequest.type === RequestType.INVITE ? basicRequest.receiverId! : basicRequest.senderId;

  // Single optimized query with all needed data
  const request = await prisma.groupRequest.findUnique({
    where: { id: requestId },
    include: {
      group: {
        select: {
          id: true,
          maxMembers: true,
          _count: { select: { members: true } },
          members: {
            where: {
              OR: [
                { userId }, // Current user's membership
                { userId: newMemberId } // Target user's membership
              ]
            },
            select: { userId: true, role: true }
          }
        }
      }
    }
  }) as RequestWithGroupAndMembers | null;

  const currentUserMembership = request!.group.members.find((m: GroupMemberWithRole) => m.userId === userId);
  const targetUserMembership = request!.group.members.find((m: GroupMemberWithRole) => m.userId === newMemberId);

  // Check permissions
  let hasPermission = false;
  if (request!.type === RequestType.INVITE) {
    hasPermission = request!.receiverId === userId;
  } else {
    hasPermission = Boolean(
      currentUserMembership &&
      (currentUserMembership.role === GroupRole.ADMIN || currentUserMembership.role === GroupRole.CO_ADMIN)
    );
  }

  if (!hasPermission) {
    throw new Error('You do not have permission to respond to this request');
  }

  if (status === 'ACCEPTED') {
    if (request!.group._count.members >= request!.group.maxMembers) {
      throw new Error('Group has reached maximum capacity');
    }
    
    if (targetUserMembership) {
      throw new Error('User is already a member of this group');
    }
  }

  // Transaction for atomic operations
  return await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.groupRequest.update({
      where: { id: requestId },
      data: {
        status: status === 'ACCEPTED' ? RequestStatus.ACCEPTED : RequestStatus.REJECTED,
      },
    });

    let membership = undefined;
    if (status === 'ACCEPTED') {
      membership = await tx.groupMember.create({
        data: {
          userId: newMemberId,
          groupId: request!.groupId,
          role: GroupRole.MEMBER,
        },
      });
    }

    // Cache invalidation (non-blocking)
    if (status === 'ACCEPTED' && membership) {
      deleteCachePatterns([
        `chat:user:${newMemberId}:*`,
        `chat:group:${request!.groupId}`,
        `chat:members:${request!.groupId}`,
        `chat:user:${userId}:requests`
      ]);
    } else {
      deleteCachePattern(`chat:user:${userId}:requests`);
    }

    return {
      request: updatedRequest,
      membership,
    } as RespondToRequestResponse;
  });
};

export const updateGroup = async (
  groupId: string,
  userId: number,
  input: UpdateGroupInput
): Promise<UpdateGroupResponse> => {
  // Single optimized query to get group with user membership and member count
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

  // Validate maxMembers if provided
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

  // Prepare update data
  const updateData: Partial<UpdateGroupInput> = {};
  
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
  if (input.isPrivate !== undefined) updateData.isPrivate = input.isPrivate;
  if (input.maxMembers !== undefined) updateData.maxMembers = input.maxMembers;

  // Update group
  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: updateData,
  });
  
  // Invalidate cache (non-blocking)
  deleteCachePatterns([
    `chat:group:${groupId}`,
    'chat:search:*'
  ]);
  
  return updatedGroup as UpdateGroupResponse;
};

export const removeMember = async (
  groupId: string,
  targetUserId: number,
  currentUserId: number
): Promise<RemoveMemberResponse> => {
  // Single optimized query to get all needed data
  const result = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: { select: { members: true } },
      members: {
        where: {
          OR: [
            { userId: currentUserId },
            { userId: targetUserId }
          ]
        },
        select: { userId: true, role: true }
      }
    }
  }) as GroupWithMembersAndCount | null;

  if (!result) throw new Error('Group not found');
  
  const currentMembership = result.members.find((m: GroupMemberWithRole) => m.userId === currentUserId);
  const targetMembership = result.members.find((m: GroupMemberWithRole) => m.userId === targetUserId);
  
  if (!currentMembership) throw new Error('You are not a member of this group');
  if (!targetMembership) throw new Error('Target user is not a member of this group');

  const isLeavingGroup = targetUserId === currentUserId;

  // Scenario 1: User is leaving the group
  if (isLeavingGroup) {
    // Check if user is the only admin
    if (currentMembership.role === GroupRole.ADMIN) {
      const adminCount = await prisma.groupMember.count({
        where: { groupId, role: GroupRole.ADMIN },
      });
      
      if (adminCount === 1 && result._count.members > 1) {
        throw new Error(
          'You are the only admin. Please promote another member to admin before leaving or delete the group'
        );
      }
    }

    // Remove member and cleanup
    const [removedMember] = await Promise.all([
      prisma.groupMember.delete({
        where: { userId_groupId: { userId: currentUserId, groupId } },
      }),
      prisma.groupRequest.deleteMany({
        where: {
          groupId,
          OR: [
            { senderId: currentUserId, status: RequestStatus.PENDING },
            { receiverId: currentUserId, status: RequestStatus.PENDING }
          ]
        }
      })
    ]);

    deleteCachePatterns([
      `chat:user:${currentUserId}:*`,
      `chat:group:${groupId}`,
      `chat:members:${groupId}`
    ]);

    return {
      success: true,
      message: 'You have successfully left the group',
      removedMember,
    };
  }
  
  // Scenario 2: Admin is kicking another member
  if (currentMembership.role !== GroupRole.ADMIN && currentMembership.role !== GroupRole.CO_ADMIN) {
    throw new Error('Only admins can remove members from the group');
  }

  if (targetUserId === result.creatorId) {
    throw new Error('Cannot remove the group creator');
  }

  // Co-admin permission checks
  if (currentMembership.role === GroupRole.CO_ADMIN) {
    if (targetMembership.role === GroupRole.ADMIN) {
      throw new Error('Co-admins cannot remove admins');
    }
    if (targetMembership.role === GroupRole.CO_ADMIN) {
      throw new Error('Co-admins cannot remove other co-admins');
    }
  }

  // Remove member and cleanup
  const [removedMember] = await Promise.all([
    prisma.groupMember.delete({
      where: { userId_groupId: { userId: targetUserId, groupId } },
    }),
    prisma.groupRequest.deleteMany({
      where: {
        groupId,
        OR: [
          { senderId: targetUserId, status: RequestStatus.PENDING },
          { receiverId: targetUserId, status: RequestStatus.PENDING }
        ]
      }
    })
  ]);

  deleteCachePatterns([
    `chat:user:${targetUserId}:*`,
    `chat:group:${groupId}`,
    `chat:members:${groupId}`
  ]);

  return {
    success: true,
    message: 'Member removed successfully',
    removedMember,
  };
};

export const deleteGroup = async (
  groupId: string,
  userId: number
): Promise<DeleteGroupResponse> => {
  // Check if group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  // Check if user is the creator
  if (group.creatorId !== userId) {
    throw new Error('Only the group creator can delete the group');
  }

  // Delete the group (cascade will handle members, messages, requests, etc.)
  const deletedGroup = await prisma.group.delete({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      creatorId: true,
    },
  });

  // Invalidate all related cache
  await deleteCachePatterns([
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


export const updateMemberRole = async (
  groupId: string,
  targetUserId: number,
  currentUserId: number,
  input: UpdateMemberRoleInput
): Promise<UpdateMemberRoleResponse> => {
  const { role } = input;

  if (!Object.values(GroupRole).includes(role)) {
    throw new ValidationError('Invalid role');
  }

  return await prisma.$transaction(async (tx) => {
    // Single query to get group with memberships and admin count
    const [groupData, adminCount] = await Promise.all([
      tx.group.findUnique({
        where: { id: groupId },
        include: {
          members: {
            where: {
              userId: { in: [currentUserId, targetUserId] }
            }
          }
        }
      }) as Promise<GroupWithMembers | null>,
      role === GroupRole.ADMIN ? tx.groupMember.count({
        where: { groupId, role: GroupRole.ADMIN }
      }) : Promise.resolve(0)
    ]);

    if (!groupData) {
      throw new NotFoundError('Group not found');
    }

    const currentMembership = groupData.members.find((m: { userId: number; role: GroupRole }) => m.userId === currentUserId);
    const targetMembership = groupData.members.find((m: { userId: number; role: GroupRole }) => m.userId === targetUserId);

    if (!currentMembership || currentMembership.role !== GroupRole.ADMIN) {
      throw new UnauthorizedError('Only admins can change member roles');
    }

    if (!targetMembership) {
      throw new NotFoundError('Target user is not a member of this group');
    }

    if (targetUserId === groupData.creatorId && role !== GroupRole.ADMIN) {
      throw new ForbiddenError('Cannot demote the group creator');
    }

    if (role === GroupRole.ADMIN && adminCount >= 3 && targetMembership.role !== GroupRole.ADMIN) {
      throw new ConflictError('Maximum of 3 admins allowed per group');
    }

    const updatedMember = await tx.groupMember.update({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
      data: { role },
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
    });

    await deleteCachePatterns([
      `chat:group:${groupId}`,
      `chat:members:${groupId}`
    ]);

    return updatedMember as UpdateMemberRoleResponse;
  });
};  

export const updateMemberSettings = async (
  groupId: string,
  userId: number,
  input: UpdateMemberSettingsInput
): Promise<UpdateMemberSettingsResponse> => {
  // Prepare update data
  const updateData: Partial<{ isMuted: boolean; muteUntil: Date | null }> = {};

  if (input.isMuted !== undefined) {
    updateData.isMuted = input.isMuted;
  }

  if (input.muteUntil !== undefined) {
    updateData.muteUntil = input.muteUntil ? new Date(input.muteUntil) : null;
  }

  try {
    // Single query - update will fail if user is not a member
    const updatedMember = await prisma.groupMember.update({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      data: updateData,
    });

    return updatedMember as UpdateMemberSettingsResponse;
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new UnauthorizedError('You are not a member of this group');
    }
    throw error;
  }
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

  await deleteCachePattern(`chat:pinned:${groupId}`);

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

  await deleteCachePattern(`chat:pinned:${groupId}`);

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
  const cached = await getCache<PinnedMessagesResponse>(cacheKey);
  if (cached) return cached;

  // Single query with membership check - will return empty array if not a member
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

  // Check if user exists in group when no pinned messages found
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

  const result = pinnedMessages.map(pm => ({
    ...pm,
    pinnedById: pm.pinnedBy,
    pinnedBy: pm.user,
  }));
  
  await setCache(cacheKey, result, CacheTTL.MEDIUM);
  return result;
};  

export const createAnnouncement = async (
  groupId: string,
  userId: number,
  input: CreateAnnouncementInput
): Promise<CreateAnnouncementResponse> => {
  const { title, content } = input;

  // Single query to check group existence and user membership
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
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  // Single query with membership check and date filter
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
    select: {
      id: true,
      groupId: true,
      senderId: true,
      type: true,
      content: true,
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
    orderBy: { createdAt: 'desc' },
  });

  return announcements.map(announcement => ({
    ...announcement,
    metadata: {
      title: announcement.content?.split(': ')[0] || 'Announcement',
      isAnnouncement: true,
    },
  })) as GetAnnouncementsListResponse;
};

export const createPoll = async (
  groupId: string,
  userId: number,
  input: CreatePollInput
): Promise<CreatePollResponse> => {
  const { question, options, allowMultiple = false, expiresAt } = input;

  if (options.length < 2) {
    throw new ValidationError('Poll must have at least 2 options');
  }

  // Single query to check group existence and user membership
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
};

export const getPoll = async (
  messageId: string,
  userId: number
): Promise<GetPollResponse> => {
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
};

export const deletePoll = async (
  messageId: string,
  userId: number
): Promise<DeletePollResponse> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      group: {
        select: {
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

  return {
    success: true,
    message: 'Poll deleted successfully'
  };
};

export const updateGroupProfileImage = async (
  groupId: string,
  userId: number,
  imageUrl: string | null
): Promise<void> => {
  // Check if user is admin or co-admin of the group
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

  // Update group image
  await prisma.group.update({
    where: { id: groupId },
    data: { imageUrl },
  });

  // Invalidate cache
  await deleteCachePatterns([
    `chat:group:${groupId}`,
    'chat:search:*'
  ]);

  console.log(`✅ Group profile image updated: ${groupId} -> ${imageUrl}`);
};       