import { UserDeletedEventType, createUserProfileCreatedEventType, UserFullNameUpdatedEventType, UserProfileDeletedEventType } from "../utils/types";

export const createUserDeletedEvent = (data: {
  userId: number;
  email: string; 
}): UserDeletedEventType => {
  return {
    eventType: 'USER_DELETED', 
    userId: data.userId,
    email: data.email,
    timestamp: new Date()
  };
}

export const createUserProfileCreatedEvent = (data: {
  userId: number;
  email: string;
  fullName: string;
  profilePic: string;
}): createUserProfileCreatedEventType => {
  return {
    eventType: 'USER_PROFILE_CREATED',
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
    profilePic: data.profilePic,
    timestamp: new Date()
  };
}

export const createUserFullNameUpdatedEvent = (data: {
  userId: number;
  fullName: string;
}): UserFullNameUpdatedEventType => {
  return {
    eventType: 'USER_FULLNAME_UPDATED',
    userId: data.userId,
    fullName: data.fullName,
    timestamp: new Date()
  };
}

export const createUserProfileDeletedEvent = (data: {
  userId: number;
}): UserProfileDeletedEventType => {
  return {
    eventType: 'USER_PROFILE_DELETED',
    userId: data.userId,
    timestamp: new Date()
  };
}
