import {Request} from 'express';

export interface CreateUser{
    email: string;
    password: string;
    fullName:string;
}
interface User{
    id:number,
    email:string,
    fullName:string,
    profilePic:string
}
export interface AuthenticatedRequest extends Request {
    cookies: any;
    user?: User;
}