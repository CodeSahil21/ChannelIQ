import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import prisma from "../db/index";
import { CacheService, CacheKeys } from '../utils/cache';
import { config } from '../utils/config';
import { SocketUser } from "../socket/types";

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
    if (!rawCookie) return next(new Error("No cookies"));

    const parsed = cookie.parse(rawCookie);
    const token = parsed.token ?? parsed.accessToken;
    if (!token) return next(new Error("No token"));

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

    const cacheKey = CacheKeys.chatUser(payload.id);

    const cached = await CacheService.get(cacheKey);
    if (cached) {
      socket.user = cached;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) return next(new Error("User not found"));

    socket.user = user;
    await CacheService.set(cacheKey, user, config.CACHE_TTL.SHORT);

    next();
  } catch {
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