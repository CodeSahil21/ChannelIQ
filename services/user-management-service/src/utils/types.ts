
import { Request } from 'express';

export interface CreateUser{
    userId:number,
    email: string;
}

// Profile Create type - matching Prisma schema
export interface CreateUserProfile {
    fullName: string;
    profilePic?: string;
    jobTitle?: string;
    department?: string;
    phoneNumber?: string;
    workEmail?: string;
    bio?: string;
    location?: string;
    timezone?: string;
    skills?: string[];
    languages?: string[];
    managerId?: number;
    managerName?: string;
    // Social links
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    twitterUrl?: string;
}

// User profile response type
export interface UserProfileResponse {
    id: number;
    fullName: string | null;
    email: string;
    profilePic: string | null;
    jobTitle: string | null;
    department: string | null;
    phoneNumber: string | null;
    workEmail: string | null;
    profileCreated: boolean;
    bio: string | null;
    location: string | null;
    timezone: string | null;
    skills: string[];
    languages: string[];
    managerId: number | null;
    managerName: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    twitterUrl: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    isOnline: boolean;
    lastSeen: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

interface User{
    id:number,
    email:string,
}

export interface AuthenticatedRequest extends Request {
    cookies: Record<string, string>;
    user?: User;
}

export interface UpdateUserProfile {
    fullName?: string;
    profilePic?: string;
    jobTitle?: string;
    department?: string;
    phoneNumber?: string;
    workEmail?: string;
    bio?: string;
    location?: string;
    timezone?: string;
    skills?: string[];
    languages?: string[];
    managerId?: number;
    managerName?: string;
    // Social links
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    twitterUrl?: string;
}

export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  BLOCKED = 'BLOCKED'
}

export interface ConnectionRequest {
  senderId: number;
  receiverId: number;
  message?: string;
}
export interface ConnectionUser {
    id: number;
    fullName: string;
    profilePic?: string;
    jobTitle?: string;
    department?: string;
    isOnline?: boolean;
    lastSeen?: Date;
}

// Simplified connection response for listing connections
export interface ConnectedUser {
    id: number;
    fullName: string;
    profilePic?: string;
    jobTitle?: string;
    department?: string;
    isOnline: boolean;
    lastSeen?: Date;
    connectionId: number;
    connectedAt: Date;
}
export interface ConnectionResponse {
  id: number;
  senderId: number;
  receiverId: number;
  status: ConnectionStatus;
  message?: string;
  sender?: {
    id: number;
    fullName: string;
    profilePic?: string;
    jobTitle?: string;
    department?: string;
  };
  receiver?: {
    id: number;
    fullName: string;
    profilePic?: string;
    jobTitle?: string;
    department?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionStats {
    totalAcceptedConnections: number;
    totalPendingConnections: number;
}

// Define a custom type for user search results
export type UserSearchResult = {
    id: number;
    fullName: string | null;
    email: string;
    profilePic: string | null;
    jobTitle: string | null;
    department: string | null;
};

export type ConnectionWithUsers = {
    id: number;
    senderId: number;
    receiverId: number;
    status: ConnectionStatus;
    message: string | null;
    createdAt: Date;
    updatedAt: Date;
    sender: {
        id: number;
        fullName: string | null;
        profilePic: string | null;
        jobTitle: string | null;
        department: string | null;
        isOnline: boolean;
        lastSeen: Date | null;
    };
    receiver: {
        id: number;
        fullName: string | null;
        profilePic: string | null;
        jobTitle: string | null;
        department: string | null;
        isOnline: boolean;
        lastSeen: Date | null;
    };
};


// Event type definitions
export type UserRegisteredEvent = {
  eventType: 'USER_REGISTERED';
  userId: number;
  email: string;
  timestamp: Date;
};

export type UserLoggedInEventType = {
  eventType: 'USER_LOGGED_IN';
  userId: number;
  email: string;
  timestamp: Date;
};

export type UserLoggedOutEventType = {
  eventType: 'USER_LOGGED_OUT';
  userId: number;
  email: string;
  timestamp: Date;
};

export interface BaseEvent{
    eventType: string;
    timestamp: Date;
}

export interface UserDeletedEventType extends BaseEvent{
    eventType: 'USER_DELETED';
    userId: number;
    email: string;
}

export enum ActivityType {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    PROFILE_UPDATE = 'PROFILE_UPDATE',
    CONNECTION_REQUEST = 'CONNECTION_REQUEST',
    CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
    CONNECTION_DECLINED = 'CONNECTION_DECLINED',
    PASSWORD_CHANGE = 'PASSWORD_CHANGE',
    ACCOUNT_DEACTIVATION = 'ACCOUNT_DEACTIVATION',
    USER_BLOCKED = 'USER_BLOCKED',
    USER_UNBLOCKED = 'USER_UNBLOCKED',
    CONNECTION_REMOVED = 'CONNECTION_REMOVED'
}

export interface createUserProfileCreatedEventType extends BaseEvent{
    eventType: 'USER_PROFILE_CREATED';
    userId: number;
    email: string;
    fullName: string;
    profilePic: string;
}

export interface UserFullNameUpdatedEventType extends BaseEvent{
    eventType: 'USER_FULLNAME_UPDATED';
    userId: number;
    email: string;
    fullName: string;
    profilePic: string;
}

export interface UserProfileDeletedEventType extends BaseEvent{
    eventType: 'USER_PROFILE_DELETED';
    userId: number;
}