import { MessageType, User, MessageReaction, MessageStatus, GroupRole } from "@prisma/client";
import { Server, Socket } from "socket.io";

/* -------------------- */
/* Core Types           */
/* -------------------- */
export interface SocketUser {
  id: number;
  email: string;
  fullName: string;
}

export interface MessageWithRelations {
  id: string;
  content: string | null; // Matches Prisma schema - nullable
  type: MessageType;
  fileUrl: string | null;
  replyToId: string | null;
  groupId: string;
  senderId: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender: User;
  reactions: MessageReaction[];
  statuses: MessageStatus[];
}

export interface SystemMessage {
  id: string;
  content: string;
  type: 'ANNOUNCEMENT'; // Use string literal instead of enum reference
  groupId: string;
  senderId: null;
  createdAt: Date;
  sender: {
    id: null;
    fullName: string;
    profileUrl: null;
  };
}

// Message data for socket operations - matches service expectations
export interface MessageData {
  id?: string;
  content?: string; // Optional string, not nullable
  type: MessageType;
  fileUrl?: string;
  replyToId?: string;
  groupId: string;
  senderId: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SocketResponse = { success: boolean; error?: string; messageId?: string };
export type SocketCallback = (response: SocketResponse) => void;

/* -------------------- */
/* Socket Events        */
/* -------------------- */
export interface ClientToServerEvents {
  "group:join": (data: { groupId: string }, cb?: SocketCallback) => void;
  "group:leave": (data: { groupId: string }) => void;
  "message:send": (data: MessageData, cb?: SocketCallback) => void;
  "message:read": (data: { messageId: string; groupId: string }) => void;
  "message:delivered": (data: { messageId: string; groupId: string }) => void;
  "message:edit": (data: { messageId: string; content: string }, cb?: SocketCallback) => void;
  "message:delete": (data: { messageId: string }, cb?: SocketCallback) => void;
  "message:reaction:add": (data: { messageId: string; emoji: string }, cb?: SocketCallback) => void;
  "message:reaction:remove": (data: { messageId: string; emoji: string }, cb?: SocketCallback) => void;
  "user:typing": (data: { groupId: string; isTyping: boolean }) => void;
  "poll:vote": (data: { pollId: string; optionId: string }, cb?: SocketCallback) => void;
  "user:status": (data: { status: "online" | "offline" }) => void;
}

export interface ServerToClientEvents {
  "message:persisted": (message: MessageWithRelations | SystemMessage) => void;
  "message:read": (data: { messageId: string; userId: number }) => void;
  "message:delivered": (data: { messageId: string; userId: number }) => void;
  "message:updated": (data: { messageId: string; content?: string; isDeleted: boolean; updatedAt: Date }) => void;
  "reaction:updated": (data: { messageId: string; emoji: string; userId: number; action: "add" | "remove" }) => void;
  "typing:updated": (data: { groupId: string; userId: number; isTyping: boolean; fullName: string }) => void;
  "poll:vote:update": (data: { pollId: string; optionId: string; userId: number; voteCount: number }) => void;
  "user:status": (data: { userId: number; status: "online" | "offline"; lastSeen?: Date }) => void;
  "group:member:added": (data: { groupId: string; userId: number; fullName: string; role: GroupRole }) => void;
  "group:member:removed": (data: { groupId: string; userId: number; fullName: string }) => void;
  "group:member:role:updated": (data: { groupId: string; userId: number; fullName: string; newRole: GroupRole }) => void;
  "system:message": (data: { content: string; groupId: string; createdAt: Date }) => void;
}

/* -------------------- */
/* Typed Socket         */
/* -------------------- */
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents> & { user: SocketUser };
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type SocketHandler = (io: TypedServer, socket: TypedSocket) => void;
