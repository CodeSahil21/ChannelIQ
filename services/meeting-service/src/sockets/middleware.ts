import jwt from 'jsonwebtoken';
import  *as cookie from 'cookie';
import { env } from '../config/env';
import { TypedSocket } from './types';
import { JWTPayload } from '../types';

export const verifySocketAuth = (socket: TypedSocket, next: (err?: Error) => void) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    console.log('🔍 Meeting Socket Auth - Raw Cookie:', rawCookie ? 'Present' : 'Missing');
    
    if (!rawCookie) {
      console.log('❌ Meeting Socket Auth - No cookies found');
      return next(new Error('No cookies'));
    }

    const parsed = cookie.parse(rawCookie);
    const token = parsed.token ?? parsed.accessToken ?? parsed.authToken;
    console.log('🔍 Meeting Socket Auth - Token found:', token ? 'Yes' : 'No');
    console.log('🔍 Meeting Socket Auth - Available cookies:', Object.keys(parsed));
    
    if (!token) {
      console.log('❌ Meeting Socket Auth - No token in cookies');
      return next(new Error('No token'));
    }

    console.log('🔍 Meeting Socket Auth - JWT Secret:', env.JWT_SECRET ? 'Present' : 'Missing');
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    console.log('✅ Meeting Socket Auth - JWT decoded successfully:', { id: decoded.id, email: decoded.email });
    
    socket.data.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Meeting Socket Auth - JWT verification failed:', error);
    next(new Error('Unauthorized'));
  }
};