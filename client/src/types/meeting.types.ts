export type MeetingStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
export type ParticipantRole = 'HOST' | 'CO_HOST' | 'PARTICIPANT';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  status: MeetingStatus;
  scheduledAt: string;
  createdAt: string;
  endedAt?: string;
  cancelledAt?: string;
  passwordEnabled: boolean;
  inviteToken: string;
  hostId: number;
  participants?: MeetingParticipant[];
}

export interface MeetingParticipant {
  id: number;
  meetingId: string;
  userId: number;
  role: ParticipantRole;
  joinedAt: string;
  leftAt?: string;
  userName?: string;
  userEmail?: string;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  scheduledAt: string;
}

export interface JoinMeetingRequest {
  inviteToken: string;
  password?: string;
}

export interface SetPasswordRequest {
  password: string;
}

export interface PromoteUserRequest {
  userId: number;
}

export interface LiveKitTokenResponse {
  token: string;
  wsUrl: string;
}

export interface MeetingState {
  currentMeeting: Meeting | null;
  participants: MeetingParticipant[];
  userRole: ParticipantRole | null;
  loading: boolean;
  error: string | null;
  joinLoading: boolean;
  tokenLoading: boolean;
  liveKitReady: boolean;
  mutedParticipants: number[];
  unmuteRequests: Array<{ userId: number; userName: string; timestamp: string }>;
  cameraDisabledParticipants: number[];
  screenSharingParticipants: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}