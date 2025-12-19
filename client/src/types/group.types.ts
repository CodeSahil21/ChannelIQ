export interface Group {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isPrivate: boolean;
  maxMembers: number;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    messages?: number;
  };
  creator?: {
    id: number;
    email: string;
    fullName: string;
    profileUrl?: string;
  };
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: number;
  groupId: string;
  role: 'ADMIN' | 'CO_ADMIN' | 'MEMBER';
  isMuted: boolean;
  muteUntil?: string;
  joinedAt: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    profileUrl?: string;
  };
}

export interface UserGroup {
  id: string;
  userId: number;
  groupId: string;
  role: 'ADMIN' | 'CO_ADMIN' | 'MEMBER';
  isMuted: boolean;
  muteUntil?: string;
  joinedAt: string;
  group: Group;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  isPrivate?: boolean;
  maxMembers?: number;
  imageUrl?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  maxMembers?: number;
  imageUrl?: string;
}

export interface GroupRequest {
  id: string;
  groupId: string;
  senderId: number;
  receiverId: number;
  type: 'INVITE' | 'JOIN_REQUEST';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    email: string;
    fullName: string;
    profileUrl?: string;
  };
  receiver: {
    id: number;
    email: string;
    fullName: string;
    profileUrl?: string;
  };
  group: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    isPrivate: boolean;
    creatorId: number;
  };
}

export interface PendingRequestsResponse {
  invites: GroupRequest[];
  joinRequests: GroupRequest[];
}

export interface SearchGroupsResponse {
  groups: Group[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface GroupState {
  groups: UserGroup[];
  currentGroup: Group | null;
  pendingRequests: PendingRequestsResponse | null;
  searchResults: Group[];
  loading: boolean;
  error: string | null;
}

// Additional types for components
export type RequestType = 'invites' | 'joinRequests';

export interface SearchGroupItem extends Group {
  // Same as Group but used for search results
}

export interface PendingRequest extends GroupRequest {
  // Same as GroupRequest but used for pending requests
}

export interface GroupDetailResponse extends Group {
  // Same as Group but used for detailed responses
}

export interface MyGroupMembership extends UserGroup {
  // Same as UserGroup but used for user's group memberships
}