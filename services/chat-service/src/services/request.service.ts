import prisma from '../db';
import { GroupRole, RequestStatus, RequestType } from '@prisma/client';
import { 
  JoinGroupResponse,
  PendingRequestsResponse,
  RespondToRequestInput,
  RespondToRequestResponse,
  GroupWithMembershipAndRequests,
  RequestWithGroupAndMembers,
  GroupMemberWithRole,
  PendingRequestWithDetails
} from '../utils/types';
import { CacheService, CacheKeys } from '../utils/cache';

export class RequestService {
  static async joinGroup(
    groupId: string,
    userId: number,
    message?: string
  ): Promise<JoinGroupResponse> {
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

    // Use upsert to handle existing requests
    const request = await prisma.groupRequest.upsert({
      where: {
        groupId_senderId_receiverId_type: {
          groupId,
          senderId: userId,
          receiverId: result.creatorId,
          type: RequestType.JOIN_REQUEST
        }
      },
      update: {
        status: RequestStatus.PENDING,
        message: message || null,
        createdAt: new Date()
      },
      create: {
        groupId,
        senderId: userId,
        receiverId: result.creatorId,
        type: RequestType.JOIN_REQUEST,
        status: RequestStatus.PENDING,
        message: message || null,
      },
    });

    return request as JoinGroupResponse;
  }

  static async getPendingRequests(userId: number): Promise<PendingRequestsResponse> {
    const cacheKey = CacheKeys.pendingRequests(userId);
    const cached = await CacheService.get<PendingRequestsResponse>(cacheKey);
    if (cached) return cached;

    const [invites, joinRequests] = await Promise.all([
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
    
    await CacheService.set(cacheKey, result, 120); // 2 minutes
    return result;
  }

  static async respondToRequest(
    requestId: string,
    userId: number,
    input: RespondToRequestInput
  ): Promise<RespondToRequestResponse> {
    const { status } = input;

    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
      throw new Error('Invalid status. Must be ACCEPTED or REJECTED');
    }

    const basicRequest = await prisma.groupRequest.findUnique({
      where: { id: requestId },
      select: { id: true, type: true, status: true, senderId: true, receiverId: true, groupId: true }
    });

    if (!basicRequest) throw new Error('Request not found');
    if (basicRequest.status !== RequestStatus.PENDING) {
      throw new Error('This request has already been processed');
    }

    const newMemberId = basicRequest.type === RequestType.INVITE ? basicRequest.receiverId! : basicRequest.senderId;

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
                  { userId },
                  { userId: newMemberId }
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

      if (status === 'ACCEPTED' && membership) {
        await CacheService.deletePatterns([
          `chat:user:${newMemberId}:*`,
          `chat:group:${request!.groupId}`,
          `chat:members:${request!.groupId}`,
          `chat:user:${userId}:requests`
        ]);
      } else {
        await CacheService.deletePattern(`chat:user:${userId}:requests`);
      }

      return {
        request: updatedRequest,
        membership,
      } as RespondToRequestResponse;
    });
  }


}