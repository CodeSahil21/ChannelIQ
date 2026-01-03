import prisma from '../db';
import { GroupRole, RequestStatus, RequestType } from '@prisma/client';
import { 
  GroupMembersResponse, 
  InviteUserInput, 
  InviteUserResponse,
  RemoveMemberResponse,
  UpdateMemberRoleInput,
  UpdateMemberRoleResponse,
  UpdateMemberSettingsInput,
  UpdateMemberSettingsResponse,
  GroupMemberWithRole,
  GroupWithMembersAndCount,
  GroupWithMembers,
  GroupWithMembershipAndRequests
} from '../utils/types';
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError, ForbiddenError } from '../utils/errors';
import { CacheService, CacheKeys } from '../utils/cache';
import { config } from '../utils/config';

export class MemberService {
  static async getGroupMembers(groupId: string, userId: number): Promise<GroupMembersResponse> {
    const cacheKey = CacheKeys.groupMembers(groupId);
    const cached = await CacheService.get<GroupMembersResponse>(cacheKey);
    
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
    await CacheService.set(cacheKey, result, config.CACHE_TTL.MEDIUM);
    return result;
  }

  static async inviteUser(
    groupId: string,
    adminUserId: number,
    input: InviteUserInput
  ): Promise<InviteUserResponse> {
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
    }) as GroupWithMembershipAndRequests | null;

    if (!result) throw new NotFoundError('Group not found');
    
    const adminMember = result.members.find((m: any) => m.userId === adminUserId);
    const existingMember = result.members.find((m: any) => m.userId === targetUserId);
    
    if (!adminMember || (adminMember.role !== GroupRole.ADMIN && adminMember.role !== GroupRole.CO_ADMIN)) {
      throw new UnauthorizedError('Only admins can invite users to the group');
    }
    if (existingMember) throw new ConflictError('User is already a member of this group');
    
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!targetUser) throw new NotFoundError('Target user not found');
    
    if (result._count.members >= result.maxMembers) throw new ConflictError('Group has reached maximum capacity');
    
    // Use upsert to handle existing requests
    const invite = await prisma.groupRequest.upsert({
      where: {
        groupId_senderId_receiverId_type: {
          groupId,
          senderId: adminUserId,
          receiverId: targetUserId,
          type: RequestType.INVITE
        }
      },
      update: {
        status: RequestStatus.PENDING,
        message: message || null,
        createdAt: new Date()
      },
      create: {
        groupId,
        senderId: adminUserId,
        receiverId: targetUserId,
        type: RequestType.INVITE,
        status: RequestStatus.PENDING,
        message: message || null,
      },
    });

    await CacheService.deletePatterns([
      `chat:user:${targetUserId}:requests`,
      `chat:user:${adminUserId}:requests`
    ]);

    return invite as InviteUserResponse;
  }

  static async removeMember(
    groupId: string,
    targetUserId: number,
    currentUserId: number
  ): Promise<RemoveMemberResponse> {
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

    if (isLeavingGroup) {
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

      const [removedMember] = await Promise.all([
        prisma.groupMember.delete({
          where: { userId_groupId: { userId: currentUserId, groupId } },
        }),
        MemberService.cleanupPendingRequests(groupId, currentUserId)
      ]);

      // Invalidate cache for all remaining group members since member count changed
      const remainingMembers = await prisma.groupMember.findMany({
        where: { groupId },
        select: { userId: true }
      });
      
      const cachePatterns = [
        `chat:group:${groupId}`,
        `chat:members:${groupId}`,
        'chat:search:*',
        ...remainingMembers.map(m => `chat:user:${m.userId}:*`),
        `chat:user:${currentUserId}:*`
      ];
      
      await CacheService.deletePatterns(cachePatterns);

      return {
        success: true,
        message: 'You have successfully left the group',
        removedMember,
      };
    }
    
    if (currentMembership.role !== GroupRole.ADMIN && currentMembership.role !== GroupRole.CO_ADMIN) {
      throw new Error('Only admins can remove members from the group');
    }

    if (targetUserId === result.creatorId) {
      throw new Error('Cannot remove the group creator');
    }

    if (currentMembership.role === GroupRole.CO_ADMIN) {
      if (targetMembership.role === GroupRole.ADMIN) {
        throw new Error('Co-admins cannot remove admins');
      }
      if (targetMembership.role === GroupRole.CO_ADMIN) {
        throw new Error('Co-admins cannot remove other co-admins');
      }
    }

    const [removedMember] = await Promise.all([
      prisma.groupMember.delete({
        where: { userId_groupId: { userId: targetUserId, groupId } },
      }),
      MemberService.cleanupPendingRequests(groupId, targetUserId)
    ]);

    // Invalidate cache for all group members since member count changed
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true }
    });
    
    const cachePatterns = [
      `chat:group:${groupId}`,
      `chat:members:${groupId}`,
      'chat:search:*',
      ...allMembers.map(m => `chat:user:${m.userId}:*`),
      `chat:user:${targetUserId}:*`,
      `chat:user:${currentUserId}:*`
    ];
    
    await CacheService.deletePatterns(cachePatterns);

    return {
      success: true,
      message: 'Member removed successfully',
      removedMember,
    };
  }

  static async updateMemberRole(
    groupId: string,
    targetUserId: number,
    currentUserId: number,
    input: UpdateMemberRoleInput
  ): Promise<UpdateMemberRoleResponse> {
    const { role } = input;

    if (!Object.values(GroupRole).includes(role)) {
      throw new ValidationError('Invalid role');
    }

    return await prisma.$transaction(async (tx) => {
      const [groupData, adminCount] = await Promise.all([
        tx.group.findUnique({
          where: { id: groupId },
          include: {
            members: {
              where: {
                userId: { in: [currentUserId, targetUserId] }
              },
              select: {
                userId: true,
                role: true
              }
            }
          }
        }),
        role === GroupRole.ADMIN ? tx.groupMember.count({
          where: { groupId, role: GroupRole.ADMIN }
        }) : Promise.resolve(0)
      ]);

      if (!groupData) {
        throw new NotFoundError('Group not found');
      }

      const typedGroupData = groupData as GroupWithMembers;

      const currentMembership = typedGroupData.members.find((m: any) => m.userId === currentUserId);
      const targetMembership = typedGroupData.members.find((m: any) => m.userId === targetUserId);

      if (!currentMembership || currentMembership.role !== GroupRole.ADMIN) {
        throw new UnauthorizedError('Only admins can change member roles');
      }

      if (!targetMembership) {
        throw new NotFoundError('Target user is not a member of this group');
      }

      if (targetUserId === typedGroupData.creatorId && role !== GroupRole.ADMIN) {
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

      await CacheService.deletePatterns([
        `chat:group:${groupId}`,
        `chat:members:${groupId}`
      ]);

      return updatedMember as UpdateMemberRoleResponse;
    });
  }

  static async updateMemberSettings(
    groupId: string,
    userId: number,
    input: UpdateMemberSettingsInput
  ): Promise<UpdateMemberSettingsResponse> {
    const updateData: Partial<{ isMuted: boolean; muteUntil: Date | null }> = {};

    if (input.isMuted !== undefined) {
      updateData.isMuted = input.isMuted;
    }

    if (input.muteUntil !== undefined) {
      updateData.muteUntil = input.muteUntil ? new Date(input.muteUntil) : null;
    }

    try {
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
  }

  private static async cleanupPendingRequests(groupId: string, userId: number) {
    return prisma.groupRequest.deleteMany({
      where: {
        groupId,
        OR: [
          { senderId: userId, status: RequestStatus.PENDING },
          { receiverId: userId, status: RequestStatus.PENDING }
        ]
      }
    });
  }
}