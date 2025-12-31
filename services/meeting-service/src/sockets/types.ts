import { ParticipantRole } from '@prisma/client';

export interface ServerToClientEvents {
  participantJoined: (data: ParticipantEventData) => void;
  participantLeft: (data: ParticipantEventData) => void;
  participantRoleChanged: (data: RoleChangeEventData) => void;
  meetingStarted: (data: MeetingEventData) => void;
  meetingEnded: (data: MeetingEventData) => void;
  participantMuted: (data: MuteEventData) => void;
  participantUnmuted: (data: MuteEventData) => void;
  unmuteRequested: (data: UnmuteRequestData) => void;
}

export interface ClientToServerEvents {
  joinMeetingRoom: (meetingId: string) => void;
  leaveMeetingRoom: (meetingId: string) => void;
  muteParticipant: (data: { meetingId: string; targetUserId: number }) => void;
  unmuteParticipant: (data: { meetingId: string; targetUserId: number }) => void;
  requestUnmute: (data: { meetingId: string }) => void;
}

export interface ParticipantEventData {
  meetingId: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  role: ParticipantRole;
  timestamp: string;
}

export interface RoleChangeEventData {
  meetingId: string;
  userId: number;
  userName?: string;
  oldRole: ParticipantRole;
  newRole: ParticipantRole;
  changedBy: number;
  timestamp: string;
}

export interface MeetingEventData {
  meetingId: string;
  hostId: number;
  timestamp: string;
}

export interface MuteEventData {
  meetingId: string;
  targetUserId: number;
  mutedBy: number;
  timestamp: string;
}

export interface UnmuteRequestData {
  meetingId: string;
  userId: number;
  userName?: string;
  timestamp: string;
}

export interface SocketData {
  user?: {
    id: number;
    email: string;
  };
}

export type TypedServer = import('socket.io').Server<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;

export type TypedSocket = import('socket.io').Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;