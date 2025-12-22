import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import prisma from "../db/index";
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

    const { accessToken } = cookie.parse(rawCookie);
    if (!accessToken) return next(new Error("No token"));

    const payload = jwt.verify(
      accessToken,
      process.env.JWT_SECRET!
    ) as { userId: number };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) return next(new Error("User not found"));

    // Attach user to socket
    socket.user = user;
    next();
  } catch (err) {
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