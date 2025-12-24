import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import prisma from "../db/index";
import { connectRedis, redis } from "../redis";
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

    await connectRedis();
    const cacheKey = `chat_user:${payload.id}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      socket.user = JSON.parse(cached);
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) return next(new Error("User not found"));

    socket.user = user;
    await redis.setEx(cacheKey, 300, JSON.stringify(user));

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