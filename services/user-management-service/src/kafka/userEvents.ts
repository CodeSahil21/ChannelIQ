import { UserDeletedEventType } from "../utils/types";

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