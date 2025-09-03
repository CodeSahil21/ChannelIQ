import {UserRegistrationEvent } from "../utils/types"

//Learning: Factory functions ensure consistent event creation and handle timestamp generation automatically.

export const createUserRegistrationEvent = (data: {
    userId:number;
    email:string;
}): UserRegistrationEvent => {
  return {
   eventType: 'USER_REGISTERED',
   userId: data.userId,
   email: data.email,
   timestamp: new Date()
  };
};


