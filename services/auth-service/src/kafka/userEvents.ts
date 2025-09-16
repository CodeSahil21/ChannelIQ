import {UserRegistrationEvent,UserLoggedInEvent,UserLoggedOutEvent } from "../utils/types"

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

export const createLoggedInUserEvent = (data : {
  userId:number;
  email:string;
}):UserLoggedInEvent=>{
  return {
    eventType: 'USER_LOGGED_IN',
    userId: data.userId,
    email: data.email,
    timestamp: new Date()
  };
}

export const createLoggedOutUserEvent = (data:{
  userId:number;
  email:string;
}):UserLoggedOutEvent =>{
  return {
    eventType: 'USER_LOGGED_OUT',
    userId: data.userId,
    email: data.email,
    timestamp: new Date()
  }
}




