import { MeetingStatus, ParticipantRole } from '@prisma/client';

export interface JWTPayload {
  id: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  scheduledAt: string;
  passwordEnabled?: boolean;
  password?: string;
  inviteExpiresAt?: string;
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  scheduledAt?: string;
}

export interface JoinMeetingRequest {
  inviteToken?: string;
  password?: string;
}

export interface PasswordRequest {
  password: string;
}

export interface RoleChangeRequest {
  userId: number;
}

export interface MeetingResponse {
  id: string;
  title: string;
  description?: string;
  hostId: number;
  status: MeetingStatus;
  inviteToken: string;
  inviteExpiresAt?: string;
  passwordEnabled: boolean;
  scheduledAt: string;
  createdAt: string;
  endedAt?: string;
  cancelledAt?: string;
  participants?: ParticipantResponse[];
}

export interface ParticipantResponse {
  id: number;
  userId: number;
  role: ParticipantRole;
  joinedAt: string;
  leftAt?: string;
}

export interface LiveKitTokenResponse {
  token: string;
  wsUrl: string;
}

export interface PasswordStatusResponse {
  passwordEnabled: boolean;
}