export type ApiSuccess<T> = { success: true; message?: string; data: T };
export type ApiError = { success: false; message?: string; error?: string; errors?: { field: string; message: string }[] };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';

export type ConnectionUser = {
  id: number;
  fullName: string | null;
  email?: string;
  profilePic?: string;
  jobTitle?: string;
  department?: string;
  isOnline?: boolean;
  lastSeen?: string | null;
};

export type ConnectionResponse = {
  id: number;
  senderId: number;
  receiverId: number;
  status: ConnectionStatus;
  message?: string;
  sender?: ConnectionUser;
  receiver?: ConnectionUser;
  createdAt: string;
  updatedAt: string;
};

export type ConnectionStatsResponse = {
  totalAcceptedConnections: number;
  totalPendingConnections: number;
  totalSentConnections: number;
  totalBlockedUsers: number;
};

export type ConnectedUser = {
  id: number;
  fullName: string;
  profilePic?: string;
  jobTitle?: string;
  department?: string;
  isOnline: boolean;
  lastSeen?: Date;
  connectionId: number;
  connectedAt: Date;
};

export type ConnectionStatusString = 'SELF' | 'BLOCKED' | 'PENDING' | 'CONNECTED' | 'NONE';

export type SendConnectionRequestRequest = { receiverId: number; message?: string };

export type SendConnectionApiResponse = ApiResponse<ConnectionResponse>;
export type AcceptConnectionApiResponse = ApiResponse<ConnectionResponse>;
export type DeclineConnectionApiResponse = ApiResponse<ConnectionResponse>;
export type BlockUserApiResponse = ApiResponse<{ message: string }>;
export type UnblockUserApiResponse = ApiResponse<{ message: string }>;
export type RemoveConnectionApiResponse = ApiResponse<{ message: string }>;
export type PendingRequestsApiResponse = ApiResponse<ConnectionResponse[]>;
export type SentRequestsApiResponse = ApiResponse<ConnectionResponse[]>;
export type ConnectionsListApiResponse = ApiResponse<ConnectionResponse[]>;
export type BlockedUsersApiResponse = ApiResponse<ConnectionResponse[]>;
export type ConnectionStatusApiResponse = ApiResponse<{ status: ConnectionStatusString }>;
export type ConnectionStatsApiResponse = ApiResponse<ConnectionStatsResponse>;
export type ConnectedUsersApiResponse = ApiResponse<ConnectedUser[]>;
