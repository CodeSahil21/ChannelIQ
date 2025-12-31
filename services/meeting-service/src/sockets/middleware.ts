import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { env } from '../config/env';
import { TypedSocket } from './types';
import { JWTPayload } from '../types';

export const verifySocketAuth = (socket: TypedSocket, next: (err?: Error) => void) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    if (!rawCookie) {
      return next(new Error('No cookies'));
    }

    const parsed = cookie.parse(rawCookie);
    const token = parsed.token ?? parsed.accessToken ?? parsed.authToken;
    if (!token) {
      return next(new Error('No token'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    socket.data.user = decoded;
    next();
  } catch (error) {
    next(new Error('Unauthorized'));
  }
};