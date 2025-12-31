import { ParticipantRole } from '@prisma/client';

export interface ServerToClientEvents {
  participantJoined: (data: ParticipantEventData) => void;
  participantLeft: (data: ParticipantEventData) => void;
  participantRoleChanged: (data: RoleChangeEventData) => void;
  meetingStarted: (data: MeetingEventData) => void;
  meetingEnded: (data: MeetingEventData) => void;
}

export interface ClientToServerEvents {
  joinMeetingRoom: (meetingId: string) => void;
  leaveMeetingRoom: (meetingId: string) => void;
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