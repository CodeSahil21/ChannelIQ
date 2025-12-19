import { Request } from 'express';
import { GroupRole,RequestStatus, RequestType,MessageType } from '@prisma/client';

export interface CreateUser{
    userId:number,
    email: string;
    fullName:string;
    profilePic:string;
}

export interface MediaEvent {
    eventType: 'PROFILE_IMAGE_UPLOADED' | 'PROFILE_IMAGE_DELETED' | 'GROUP_PROFILE_IMAGE_UPLOADED' | 'GROUP_PROFILE_IMAGE_DELETED';
    userId: string;
    imageUrl?: string;
    timestamp: string;
    metadata?: {
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
        originalName?: string;
        groupId?: string;
    };
}

interface User{
    id:number,
    email:string,
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