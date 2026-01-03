import { MeetingStatus, ParticipantRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { 
  CreateMeetingRequest, 
  UpdateMeetingRequest, 
  JoinMeetingRequest,
  MeetingResponse,
  ParticipantResponse 
} from '../types';
import { CacheService, CacheKeys } from '../utils/cache';
import { CACHE_TTL } from '../config/env';

export const createMeeting = async (hostId: number, data: CreateMeetingRequest): Promise<MeetingResponse> => {
  const inviteToken = generateInviteToken();
  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;

  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      description: data.description,
      hostId,
      inviteToken,
      inviteExpiresAt: data.inviteExpiresAt ? new Date(data.inviteExpiresAt) : null,
      passwordHash,
      passwordEnabled: data.passwordEnabled || false,
      scheduledAt: new Date(data.scheduledAt),
    },
    include: {
      participants: true,
    },
  });

  // Add host as participant
  await prisma.meetingParticipant.create({
    data: {
      meetingId: meeting.id,
      userId: hostId,
      role: 'HOST',
    },
  });

  // Invalidate cache
  await CacheService.delete(CacheKeys.meetingUser(hostId));

  return formatMeetingResponse(meeting);
};

export const getMeetingById = async (id: string, userId?: number): Promise<MeetingResponse | null> => {
  const cacheKey = CacheKeys.meeting(id);
  const cached = await CacheService.get<MeetingResponse>(cacheKey);
  if (cached) return cached;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      participants: true,
    },
  });

  if (!meeting) return null;

  const isParticipant = userId && meeting.participants.some(p => p.userId === userId);
  const result = formatMeetingResponse(meeting, !isParticipant);
  
  await CacheService.set(cacheKey, result, CACHE_TTL.MEETING);
  return result;
};

export const searchMeeting = async (meetingId: string): Promise<Pick<MeetingResponse, 'id' | 'title' | 'status' | 'passwordEnabled'> | null> => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      title: true,
      status: true,
      passwordEnabled: true,
    },
  });

  return meeting;
};

export const getUserMeetings = async (userId: number, page: number = 1, limit: number = 10): Promise<MeetingResponse[]> => {
  const cacheKey = `${CacheKeys.meetingUser(userId)}:meetings:${page}:${limit}`;
  const cached = await CacheService.get<MeetingResponse[]>(cacheKey);
  if (cached) return cached;

  const meetings = await prisma.meeting.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: {
      participants: true,
    },
    orderBy: { scheduledAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const result = meetings.map(meeting => formatMeetingResponse(meeting));
  await CacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
  return result;
};

export const updateMeeting = async (id: string, hostId: number, data: UpdateMeetingRequest): Promise<MeetingResponse> => {
  const meeting = await validateMeetingAccess(id, hostId, 'HOST');
  
  if (meeting.status !== 'SCHEDULED') {
    throw new Error('Only scheduled meetings can be updated');
  }

  const updated = await prisma.meeting.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
    include: {
      participants: true,
    },
  });

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
  await CacheService.delete(CacheKeys.meetingUser(hostId));

  return formatMeetingResponse(updated);
};

export const cancelMeeting = async (id: string, hostId: number): Promise<void> => {
  const meeting = await validateMeetingAccess(id, hostId, 'HOST');
  
  if (meeting.status !== 'SCHEDULED') {
    throw new Error('Only scheduled meetings can be cancelled');
  }

  await prisma.meeting.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
  await CacheService.delete(CacheKeys.meetingUser(hostId));
};

export const startMeeting = async (id: string, userId: number): Promise<void> => {
  const meeting = await validateMeetingAccess(id, userId, ['HOST', 'CO_HOST']);
  
  if (meeting.status !== 'SCHEDULED') {
    throw new Error('Only scheduled meetings can be started');
  }

  await prisma.meeting.update({
    where: { id },
    data: { status: 'LIVE' },
  });

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
};

export const endMeeting = async (id: string, hostId: number): Promise<void> => {
  const meeting = await validateMeetingAccess(id, hostId, 'HOST');
  
  if (meeting.status !== 'LIVE') {
    throw new Error('Only live meetings can be ended');
  }

  await prisma.meeting.update({
    where: { id },
    data: {
      status: 'ENDED',
      endedAt: new Date(),
    },
  });

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
};

export const joinMeeting = async (id: string, userId: number, data: JoinMeetingRequest): Promise<{role: ParticipantRole, userName?: string, userEmail?: string}> => {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { participants: true },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  // Check if already a participant
  const existingParticipant = meeting.participants.find(p => p.userId === userId);
  if (existingParticipant) {
    // Get user details for existing participant
    const userDetails = await getUserDetails(userId);
    return { 
      role: existingParticipant.role,
      userName: userDetails?.name,
      userEmail: userDetails?.email
    };
  }

  // Validate access
  const hasAccess = await validateJoinAccess(meeting, data);
  if (!hasAccess) {
    throw new Error('Invalid credentials');
  }

  // Add as participant
  const participant = await prisma.meetingParticipant.create({
    data: {
      meetingId: id,
      userId,
      role: 'PARTICIPANT',
    },
  });

  // Get user details
  const userDetails = await getUserDetails(userId);

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
  await CacheService.delete(CacheKeys.meetingParticipants(id));

  return { 
    role: participant.role,
    userName: userDetails?.name,
    userEmail: userDetails?.email
  };
};

export const setPassword = async (id: string, hostId: number, password: string): Promise<void> => {
  await validateMeetingAccess(id, hostId, 'HOST');
  
  const passwordHash = await bcrypt.hash(password, 12);
  
  await prisma.meeting.update({
    where: { id },
    data: {
      passwordHash,
      passwordEnabled: true,
    },
  });

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
};

export const removePassword = async (id: string, hostId: number): Promise<void> => {
  await validateMeetingAccess(id, hostId, 'HOST');
  
  await prisma.meeting.update({
    where: { id },
    data: {
      passwordHash: null,
      passwordEnabled: false,
    },
  });

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
};

export const promoteToCoHost = async (id: string, hostId: number, targetUserId: number): Promise<{userName?: string}> => {
  await prisma.$transaction(async (tx) => {
    const meeting = await tx.meeting.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const hostParticipant = meeting.participants.find(p => p.userId === hostId);
    if (!hostParticipant || hostParticipant.role !== 'HOST') {
      throw new Error('Access denied');
    }

    // Check co-host limit atomically
    const coHostCount = meeting.participants.filter(p => p.role === 'CO_HOST').length;
    if (coHostCount >= 3) {
      throw new Error('Maximum 3 co-hosts allowed');
    }

    await tx.meetingParticipant.updateMany({
      where: {
        meetingId: id,
        userId: targetUserId,
      },
      data: { role: 'CO_HOST' },
    });
  });

  // Get user details
  const userDetails = await getUserDetails(targetUserId);

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
  await CacheService.delete(CacheKeys.meetingParticipants(id));

  return { userName: userDetails?.name };
};

export const leaveMeeting = async (id: string, userId: number): Promise<{role: ParticipantRole, userName?: string, userEmail?: string}> => {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { participants: true },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  const participant = meeting.participants.find(p => p.userId === userId);
  if (!participant) {
    throw new Error('Not a participant');
  }

  // Get user details before leaving
  const userDetails = await getUserDetails(userId);
  const participantRole = participant.role;

  // If host is leaving, handle succession
  if (participant.role === 'HOST') {
    const coHosts = meeting.participants.filter(p => p.role === 'CO_HOST');
    
    if (coHosts.length > 0) {
      // Promote oldest co-host to host
      const newHost = coHosts.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
      
      await prisma.$transaction([
        // Remove current host
        prisma.meetingParticipant.delete({
          where: { id: participant.id },
        }),
        // Promote co-host to host
        prisma.meetingParticipant.update({
          where: { id: newHost.id },
          data: { role: 'HOST' },
        }),
      ]);
    } else {
      // No co-hosts available, end the meeting
      await prisma.$transaction([
        prisma.meetingParticipant.delete({
          where: { id: participant.id },
        }),
        prisma.meeting.update({
          where: { id },
          data: {
            status: 'ENDED',
            endedAt: new Date(),
          },
        }),
      ]);
    }
  } else {
    // Regular participant leaving
    await prisma.meetingParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() },
    });
  }

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
  await CacheService.delete(CacheKeys.meetingParticipants(id));

  return {
    role: participantRole,
    userName: userDetails?.name,
    userEmail: userDetails?.email
  };
};

export const demoteCoHost = async (id: string, hostId: number, targetUserId: number): Promise<{userName?: string}> => {
  await validateMeetingAccess(id, hostId, 'HOST');
  
  await prisma.meetingParticipant.updateMany({
    where: {
      meetingId: id,
      userId: targetUserId,
      role: 'CO_HOST',
    },
    data: { role: 'PARTICIPANT' },
  });

  // Get user details
  const userDetails = await getUserDetails(targetUserId);

  // Invalidate cache
  await CacheService.delete(CacheKeys.meeting(id));
  await CacheService.delete(CacheKeys.meetingParticipants(id));

  return { userName: userDetails?.name };
};

const getUserDetails = async (userId: number): Promise<{name?: string, email?: string} | null> => {
  try {
    return {
      name: `User ${userId}`,
      email: `user${userId}@example.com`
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

const validateMeetingAccess = async (
  id: string, 
  userId: number, 
  requiredRoles: ParticipantRole | ParticipantRole[]
) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { participants: true },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  const participant = meeting.participants.find(p => p.userId === userId);
  if (!participant) {
    throw new Error('Access denied');
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  if (!roles.includes(participant.role)) {
    throw new Error('Insufficient permissions');
  }

  return meeting;
};

const validateJoinAccess = async (meeting: any, data: JoinMeetingRequest): Promise<boolean> => {
  console.log('Validating join access:', { meetingId: meeting.id, data });
  console.log('Meeting invite token:', meeting.inviteToken);
  console.log('Meeting password enabled:', meeting.passwordEnabled);
  
  // Check invite token
  if (data.inviteToken) {
    console.log('Checking invite token:', data.inviteToken);
    if (meeting.inviteToken !== data.inviteToken) {
      console.log('Invite token mismatch');
      return false;
    }
    
    if (meeting.inviteExpiresAt && new Date() > meeting.inviteExpiresAt) {
      console.log('Invite token expired');
      return false;
    }
    
    console.log('Invite token valid');
    return true;
  }

  // Check password
  if (data.password && meeting.passwordEnabled && meeting.passwordHash) {
    console.log('Checking password');
    const isValid = await bcrypt.compare(data.password, meeting.passwordHash);
    console.log('Password valid:', isValid);
    return isValid;
  }

  console.log('No valid credentials provided');
  return false;
};

const generateInviteToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const formatMeetingResponse = (meeting: any, hideSensitive: boolean = false): MeetingResponse => {
  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    hostId: meeting.hostId,
    status: meeting.status,
    inviteToken: hideSensitive ? '' : meeting.inviteToken,
    inviteExpiresAt: meeting.inviteExpiresAt?.toISOString(),
    passwordEnabled: meeting.passwordEnabled,
    scheduledAt: meeting.scheduledAt.toISOString(),
    createdAt: meeting.createdAt.toISOString(),
    endedAt: meeting.endedAt?.toISOString(),
    cancelledAt: meeting.cancelledAt?.toISOString(),
    participants: meeting.participants?.map((p: any): ParticipantResponse => ({
      id: p.id,
      userId: p.userId,
      role: p.role,
      joinedAt: p.joinedAt.toISOString(),
      leftAt: p.leftAt?.toISOString(),
    })),
  };
};