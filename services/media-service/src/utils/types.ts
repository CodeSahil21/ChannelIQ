import { Request } from 'express';

interface User {
    id: number;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    cookies: Record<string, string>;
    user?: User;
    sessionJti?: string;
}

export type MessageType = 'IMAGE' | 'VIDEO' | 'FILE';

export interface MessageFileUploadResponse {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    groupId: string;
    messageType: MessageType;
}