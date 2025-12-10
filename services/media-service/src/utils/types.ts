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