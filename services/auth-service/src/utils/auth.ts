import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
//function to hash password :we always save hashed password in db so that db admin can't see the password
export const hashPassword = async (password:string): Promise<string> =>{
      return await bcrypt.hash(password,10);
}
//to compare password with hashed password
export const comparePassword = async (password:string,hashedPassword:string ): Promise<boolean> =>{
    return await bcrypt.compare(password,hashedPassword);
}

//to generate token
export const generateToken  = (userId:number, expiresIn: string = '7d'): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    const jti = crypto.randomUUID();
    return jwt.sign({ id: userId, jti }, secret as jwt.Secret, { expiresIn } as jwt.SignOptions);
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