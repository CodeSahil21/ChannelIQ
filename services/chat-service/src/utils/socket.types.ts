export interface MessageData {
  id?: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'POLL' | 'ANNOUNCEMENT';
  fileUrl?: string;
  replyToId?: string;
  groupId: string;
  senderId: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SendMessageData {
  content?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'POLL' | 'ANNOUNCEMENT';
  fileUrl?: string;
  replyToId?: string;
  groupId: string;
}

export interface MessageWithSender {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'POLL' | 'ANNOUNCEMENT';
  fileUrl?: string;
  replyToId?: string;
  groupId: string;
  senderId: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: number;
    fullName: string;
    profileUrl?: string;
  };
  replyTo?: {
    id: string;
    content?: string;
    sender: {
      fullName: string;
    };
  };
}

export interface JoinGroupData {
  groupId: string;
}

export interface SocketEvents {
  'join-group': (groupId: string) => void;
  'leave-group': (groupId: string) => void;
  'send-message': (data: MessageData) => void;
  'new-message': (data: MessageData) => void;
}