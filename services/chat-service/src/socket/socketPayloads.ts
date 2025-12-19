import { Server, Socket } from "socket.io";

export type UserID = string;
export type GroupID = string;
export type MessageID = string;

export type ISODate = string;

// Generic room naming
export const groupRoom = (groupId: GroupID) => `group:${groupId}` as const;

// Client -> Server payloads
export interface JoinRoomPayload {
  groupId: GroupID;
}
export interface LeaveRoomPayload {
  groupId: GroupID;
}
export interface TypingPayload {
  groupId: GroupID;
  isTyping: boolean;
}
export interface SendMessagePayload {
  groupId: GroupID;
  content: string;
  type?: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  tempId?: string; // client temp id for optimistic UI
  metadata?: Record<string, unknown>;
}
export interface ReadReceiptPayload {
  groupId: GroupID;
  messageIds: MessageID[];
}

// Server -> Client payloads
export interface MessageQueuedEvent {
  messageId: MessageID;
  tempId?: string;
  groupId: GroupID;
  senderId: UserID;
  content: string;
  type?: string;
  createdAt: ISODate;
  metadata?: Record<string, unknown>;
}
export interface MessagePersistedEvent extends MessageQueuedEvent {
  persistedAt: ISODate;
}
export interface DeliveryEvent {
  groupId: GroupID;
  messageId: MessageID;
  userId: UserID;
  status: "SENT" | "DELIVERED" | "READ";
  at: ISODate;
}

// Socket.IO typing
export interface ClientToServerEvents {
  "room:join": (payload: JoinRoomPayload, ack?: (ok: true) => void) => void;
  "room:leave": (payload: LeaveRoomPayload, ack?: (ok: true) => void) => void;
  "typing:update": (payload: TypingPayload) => void;
  "message:send": (
    payload: SendMessagePayload,
    ack?: (res: { ok: true; messageId: MessageID; tempId?: string }) => void
  ) => void;
  "message:read": (payload: ReadReceiptPayload) => void;
}

export interface ServerToClientEvents {
  "message:queued": (event: MessageQueuedEvent) => void;
  "message:persisted": (event: MessagePersistedEvent) => void;
  "message:delivery": (event: DeliveryEvent) => void;
  "typing:updated": (payload: TypingPayload & { userId: UserID }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: UserID;
}

export type IOServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;