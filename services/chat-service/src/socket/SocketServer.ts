import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { SendMessageData, MessageWithSender } from '../utils/socket.types';
import { randomUUID } from 'crypto';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

export class SocketServer {
  private io: Server;

  constructor(server: any) {
    this.io = new Server(server, {
      cors: { origin: "*" }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('No token provided'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { id: number };
        socket.userId = decoded.id;
        next();
      } catch (err) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);

      socket.on('join-group', (groupId: string) => {
        socket.join(`group:${groupId}`);
        console.log(`User ${socket.userId} joined group ${groupId}`);
      });

      socket.on('leave-group', (groupId: string) => {
        socket.leave(`group:${groupId}`);
        console.log(`User ${socket.userId} left group ${groupId}`);
      });

      socket.on('send-message', (data: SendMessageData) => {
        const messageData: MessageWithSender = {
          id: randomUUID(),
          content: data.content,
          type: data.type,
          fileUrl: data.fileUrl,
          replyToId: data.replyToId,
          groupId: data.groupId,
          senderId: socket.userId!,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          sender: {
            id: socket.userId!,
            fullName: 'User Name', // Will be populated from DB later
            profileUrl: undefined
          }
        };

        // Emit to group members immediately
        this.io.to(`group:${data.groupId}`).emit('new-message', messageData);
        console.log(`Message sent to group ${data.groupId} by user ${socket.userId}`);
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });
    });
  }

  public emitToGroup(groupId: string, event: string, data: any) {
    this.io.to(`group:${groupId}`).emit(event, data);
  }
}