import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
//function to hash password :we always save hashed password in db so that db admin can't see the password
export const hashPassword = async (password:string): Promise<string> =>{
      return await bcrypt.hash(password,10);
}
//to compare password with hashed password
export const comparePassword = async (password:string,hashedPassword:string ): Promise<boolean> =>{
    return await bcrypt.compare(password,hashedPassword);
}

export const generateToken  = (userId:number, expiresIn: string = '7d'): string => {
    const jti = crypto.randomUUID();
    return jwt.sign({ id: userId, jti }, env.JWT_SECRET as string, { expiresIn } as SignOptions);
};

export const generateOTP = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};

export const getOTPExpirationTime = (): Date => {
    const now = new Date();
    return new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
};

export const isOTPExpired = (expiresAt: Date): boolean => {
    return new Date() > expiresAt;
};

export const decodeJwtUnsafe = (token: string): { exp?: number; jti?: string } => {
    const decoded = jwt.decode(token) as { exp?: number; jti?: string } | null;
    return decoded || {};
};