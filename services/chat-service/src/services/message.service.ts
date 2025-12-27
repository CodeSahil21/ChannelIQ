import prisma from '../db';
import { MessageType} from '@prisma/client';

export interface MessageWithDetails {
  id: string;
  content: string | null;
  type: MessageType;
  fileUrl: string | null;
  replyToId: string | null;
  groupId: string;
  senderId: number;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: number;
    fullName: string;
    profileUrl: string | null;
  };
  replyTo?: {
    id: string;
    content: string | null;
    type: MessageType;
    sender: {
      fullName: string;
    };
  } | null;
}

export const getGroupMessages = async (
  groupId: string, 
  userId: number, 
  limit: number = 50, 
  cursor?: string
): Promise<MessageWithDetails[]> => {
  const messages = await prisma.message.findMany({
    where: {
      groupId,
      isDeleted: false,
      ...(cursor && { id: { lt: cursor } }),
      group: {
        members: {
          some: { userId },
        },
      },
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profileUrl: true
        }
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          type: true,
          sender: {
            select: {
              fullName: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  
  if (messages.length === 0) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
      select: { id: true },
    });
    if (!membership) throw new Error('Not authorized to view messages');
  }

  return messages.reverse();
};