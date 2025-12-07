import {Request} from 'express';

export interface CreateUser{
    email: string;
    password: string;
}
interface User{
    id:number,
    email:string,
}
export interface AuthenticatedRequest extends Request {
    cookies: Record<string, string>;
    user?: User;
    sessionJti?: string;
}
//base event interface: all events must implement this
export interface BaseEvent{
    eventType: string;
    timestamp: Date;
}

//user Registration Event
export interface UserRegistrationEvent extends BaseEvent {
    userId: number;
    email: string;
}

export interface UserLoggedInEvent extends BaseEvent {
    userId:number;
    email:string;
}

export interface UserLoggedOutEvent extends BaseEvent {
    userId: number;
    email: string;
}