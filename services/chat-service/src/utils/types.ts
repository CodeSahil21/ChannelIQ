import { Request } from 'express';
import { GroupRole,RequestStatus, RequestType,MessageType } from '@prisma/client';

export interface CreateUser{
    userId:number,
    email: string;
    fullName:string;
    profilePic:string;
}

export interface MediaEvent {
    eventType: 'PROFILE_IMAGE_UPLOADED' | 'PROFILE_IMAGE_DELETED' | 'GROUP_PROFILE_IMAGE_UPLOADED' | 'GROUP_PROFILE_IMAGE_DELETED' | 'MESSAGE_FILE_UPLOADED' | 'MESSAGE_FILE_DELETED';
    userId: string;
    imageUrl?: string;
    timestamp: string;
    metadata?: {
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
        originalName?: string;
        groupId?: string;
        messageType?: 'IMAGE' | 'VIDEO' | 'FILE';
    };
}

interface User{
    id:number,
    email:string,
    fullName:string,
}

export interface AuthenticatedRequest extends Request {
    cookies: Record<string, string>;
    user?: User;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  isPrivate?: boolean;
  imageUrl?: string;
  maxMembers?: number;
}

export interface UserBasic {
  id: number;
  email: string;
  fullName: string;
  profileUrl: string | null;
}

export interface GroupMemberResponse {
  id: string;
  userId: number;
  groupId: string;
  role: string;
  isMuted: boolean;
  muteUntil: Date | null;
  joinedAt: Date;
  user: UserBasic;
}

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  maxMembers: number;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  creator: UserBasic;
  members: GroupMemberResponse[];
}

export interface MyGroupItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  maxMembers: number;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
  };
}

export interface MyGroupMembership {
  id: string;
  userId: number;
  groupId: string;
  role: GroupRole;
  isMuted: boolean;
  muteUntil: Date | null;
  joinedAt: Date;
  group: MyGroupItem;
}

export type MyGroupsResponse = MyGroupMembership[];

export interface GroupDetailResponse {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  maxMembers: number;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  creator: UserBasic;
  _count: {
    members: number;
    messages: number;
  };
  members: GroupMemberResponse[];
}


export interface SearchGroupsQuery {
  query: string;
  page?: number;
  limit?: number;
}

export interface PublicGroupItem {
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
  creator: UserBasic;
}

export interface SearchGroupsResponse {
  groups: PublicGroupItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GroupMemberDetail {
  id: string;
  userId: number;
  groupId: string;
  role: GroupRole;
  isMuted: boolean;
  muteUntil: Date | null;
  joinedAt: Date;
  user: UserBasic;
}

export type GroupMembersResponse = GroupMemberDetail[];


export interface JoinGroupResponse {
  id: string;
  groupId: string;
  senderId: number;
  receiverId: number;
  type: RequestType;
  status: RequestStatus;
  createdAt: Date;
  message?: string;
}

export interface InviteUserInput {
  targetUserId: number;
  message?: string;
}

export interface InviteUserResponse {
  id: string;
  groupId: string;
  senderId: number;
  receiverId: number;
  type: RequestType;
  status: RequestStatus;
  createdAt: Date;
  message?: string;
}

export interface PendingRequestItem {
  id: string;
  groupId: string;
  senderId: number;
  receiverId: number;
  type: RequestType;
  status: RequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  sender: UserBasic;
  receiver: UserBasic;
  group: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    isPrivate: boolean;
    creatorId: number;
  };
}

export interface PendingRequestsResponse {
  invites: PendingRequestItem[]; // Invites sent to me
  joinRequests: PendingRequestItem[]; // Join requests for groups I admin
}

export interface RespondToRequestInput {
  status: 'ACCEPTED' | 'REJECTED';
}

export interface RespondToRequestResponse {
  request: {
    id: string;
    groupId: string;
    senderId: number;
    receiverId: number;
    type: RequestType;
    status: RequestStatus;
    message: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  membership?: {
    id: string;
    userId: number;
    groupId: string;
    role: GroupRole;
    joinedAt: Date;
  };
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  isPrivate?: boolean;
  maxMembers?: number;
}

export interface UpdateGroupResponse {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  maxMembers: number;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RemoveMemberResponse {
  success: boolean;
  message: string;
  removedMember?: {
    id: string;
    userId: number;
    groupId: string;
    role: GroupRole;
  };
}

export interface DeleteGroupResponse {
  success: boolean;
  message: string;
  deletedGroup: {
    id: string;
    name: string;
    creatorId: number;
  };
}

export interface UpdateMemberRoleInput {
  role: GroupRole;
}

export interface UpdateMemberRoleResponse {
  id: string;
  userId: number;
  groupId: string;
  role: GroupRole;
  joinedAt: Date;
  user: UserBasic;
}

export interface UpdateMemberSettingsInput {
  isMuted?: boolean;
  muteUntil?: string | null;
}

export interface UpdateMemberSettingsResponse {
  id: string;
  userId: number;
  groupId: string;
  role: GroupRole;
  isMuted: boolean;
  muteUntil: Date | null;
  joinedAt: Date;
}

export interface PinMessageResponse {
  id: string;
  groupId: string;
  messageId: string;
  pinnedById: number;
  pinnedAt: Date;
  message: {
    id: string;
    content: string | null;
    type: MessageType;
    senderId: number;
    createdAt: Date;
  };
}

export interface UnpinMessageResponse {
  success: boolean;
  message: string;
}

export interface PinnedMessageItem {
  id: string;
  groupId: string;
  messageId: string;
  pinnedById: number;
  pinnedAt: Date;
  message: {
    id: string;
    content: string | null;
    type: MessageType;
    senderId: number;
    createdAt: Date;
    sender: UserBasic;
  };
  pinnedBy: UserBasic;
}

export type PinnedMessagesResponse = PinnedMessageItem[];

export interface CreateAnnouncementInput {
  title: string;
  content: string;
}

export interface AnnouncementMetadata {
  title: string;
  isAnnouncement: boolean;
}

export interface CreateAnnouncementResponse {
  id: string;
  groupId: string;
  senderId: number;
  type: MessageType;
  content: string;
  metadata: AnnouncementMetadata;
  createdAt: Date;
  updatedAt: Date;
  sender: UserBasic;
}

export interface GetAnnouncementsResponse {
  id: string;
  groupId: string;
  senderId: number;
  type: MessageType;
  content: string;
  createdAt: Date;
  sender: UserBasic;
  metadata: AnnouncementMetadata;
}

export type GetAnnouncementsListResponse = GetAnnouncementsResponse[];

export interface CreatePollInput {
  question: string;
  options: string[];
  allowMultiple?: boolean;
  expiresAt?: string;
}

export interface PollOptionResponse {
  id: string;
  text: string;
  voteCount: number;
  hasVoted: boolean;
}

export interface CreatePollResponse {
  id: string;
  groupId: string;
  senderId: number;
  type: MessageType;
  content: string | null;
  createdAt: Date;
  sender: UserBasic;
  poll: {
    id: string;
    question: string;
    allowMultiple: boolean;
    expiresAt: Date | null;
    options: PollOptionResponse[];
  };
}

export interface GetPollResponse {
  id: string;
  question: string;
  allowMultiple: boolean;
  expiresAt: Date | null;
  messageId: string;
  options: PollOptionResponse[];
}

export interface DeletePollResponse {
  success: boolean;
  message: string;
  poll?: {
    message: {
      groupId: string;
    };
  };
}

export interface Poll {
  id: string;
  question: string;
  allowMultiple: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  createdBy: UserBasic;
  options: {
    id: string;
    text: string;
    votes: number;
    hasVoted: boolean;
  }[];
}

export interface VotePollResponse {
  groupId: string;
  voteCount: number;
}

export type GroupWithMembershipAndRequests = {
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

export type RequestWithGroupAndMembers = {
  id: string;
  groupId: string;
  senderId: number;
  receiverId: number | null;
  type: RequestType;
  status: RequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  group: {
    id: string;
    maxMembers: number;
    _count: {
      members: number;
    };
    members: {
      userId: number;
      role: GroupRole;
    }[];
  };
};

export type GroupMemberWithRole = {
  userId: number;
  role: GroupRole;
};

export type GroupWithMembersAndCount = {
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
};

export type PendingRequestWithDetails = {
  id: string;
  groupId: string;
  senderId: number;
  receiverId: number;
  type: RequestType;
  status: RequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: number;
    email: string;
    fullName: string;
    profileUrl: string | null;
  };
  receiver: {
    id: number;
    email: string;
    fullName: string;
    profileUrl: string | null;
  };
  group: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    isPrivate: boolean;
    creatorId: number;
  };
};

export type GroupWithMembers = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  maxMembers: number;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  members: {
    userId: number;
    role: GroupRole;
  }[];
};