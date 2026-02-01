import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import prisma from "../db/index";
import { CacheService, CacheKeys } from '../utils/cache';
import { SocketUser } from "../socket/types";
import { env } from '../config/env';

declare module "socket.io" {
  interface Socket {
    user: SocketUser;
  }
}

export const verifySocketAuth = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    console.log('🔍 Chat Socket Auth - Raw Cookie:', rawCookie ? 'Present' : 'Missing');
    
    if (!rawCookie) {
      console.log('❌ Chat Socket Auth - No cookies found');
      return next(new Error("No cookies"));
    }

    const parsed = cookie.parse(rawCookie);
    const token = parsed.token ?? parsed.accessToken ?? parsed.authToken;
    console.log('🔍 Chat Socket Auth - Token found:', token ? 'Yes' : 'No');
    console.log('🔍 Chat Socket Auth - Available cookies:', Object.keys(parsed));
    
    if (!token) {
      console.log('❌ Chat Socket Auth - No token in cookies');
      return next(new Error("No token"));
    }

    console.log('🔍 Chat Socket Auth - JWT Secret:', env.JWT_SECRET ? 'Present' : 'Missing');
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: number; email: string };
    console.log('✅ Chat Socket Auth - JWT decoded successfully:', { id: payload.id, email: payload.email });

    const cacheKey = CacheKeys.chatUser(payload.id);

    const cached = await CacheService.get(cacheKey);
    if (cached) {
      socket.user = cached;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, fullName: true, profileUrl: true },
    });

    if (!user) {
      console.log('❌ Chat Socket Auth - User not found in database');
      return next(new Error("User not found"));
    }

    socket.user = user;
    await CacheService.set(cacheKey, user, 120); // 2 minutes

    next();
  } catch (error) {
    console.error('❌ Chat Socket Auth - JWT verification failed:', error);
    next(new Error("Unauthorized"));
  }
};

export const requireGroupMember = async (
  userId: number,
  groupId: string
) => {
  const member = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: { userId, groupId },
    },
  });

  if (!member) throw new Error("Not a group member");
  return member;
};