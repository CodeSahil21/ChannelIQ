import {UserRegistrationEvent } from "../utils/types"

//Learning: Factory functions ensure consistent event creation and handle timestamp generation automatically.

export const createUserRegistrationEvent = (data: {
    userId:number;
    fullName:string;
    email:string;
    profilePic:string
}): UserRegistrationEvent => {
  return {
   eventType: 'USER_REGISTERED',
   userId: data.userId,
   fullName: data.fullName,
   email: data.email,
   profilePic: data.profilePic,
   timestamp: new Date()
  };
};


