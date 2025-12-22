import prisma from '../db';
import { MessageType, DeliveryStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface CreateMessageInput {
  content?: string;
  type: MessageType;
  fileUrl?: string;
  replyToId?: string;
  groupId: string;
  senderId: number;
}

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

export const createMessage = async (input: CreateMessageInput): Promise<MessageWithDetails> => {
  return await prisma.$transaction(async (tx) => {
    // Create the message
    const message = await tx.message.create({
      data: {
        id: uuidv4(),
        content: input.content || null,
        type: input.type,
        fileUrl: input.fileUrl || null,
        replyToId: input.replyToId || null,
        groupId: input.groupId,
        senderId: input.senderId
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
      }
    });

    // Create delivery status for all group members
    const groupMembers = await tx.groupMember.findMany({
      where: { groupId: input.groupId },
      select: { userId: true }
    });

    await tx.messageStatus.createMany({
      data: groupMembers.map(member => ({
        id: uuidv4(),
        messageId: message.id,
        userId: member.userId,
        status: member.userId === input.senderId ? DeliveryStatus.READ : DeliveryStatus.SENT
      }))
    });

    return message;
  });
};

export const markMessageAsRead = async (messageId: string, userId: number): Promise<void> => {
  await prisma.messageStatus.updateMany({
    where: {
      messageId,
      userId
    },
    data: {
      status: DeliveryStatus.READ,
      updatedAt: new Date()
    }
  });
};

export const getGroupMessages = async (
  groupId: string, 
  userId: number, 
  limit: number = 50, 
  cursor?: string
): Promise<MessageWithDetails[]> => {
  // Verify user is member
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: { userId, groupId }
    }
  });

  if (!membership) {
    throw new Error('Not authorized to view messages');
  }

  return await prisma.message.findMany({
    where: {
      groupId,
      isDeleted: false,
      ...(cursor && { id: { lt: cursor } })
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
};