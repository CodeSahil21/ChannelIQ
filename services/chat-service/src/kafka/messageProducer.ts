import { kafkaProducer } from './kafkaManager';
import { MessageType } from '@prisma/client';

export interface MessageEvent {
  eventType: 'MESSAGE_CREATED';
  messageId: string;
  content?: string | undefined;
  type: MessageType;
  fileUrl?: string | undefined;
  groupId: string;
  senderId: number;
  replyToId?: string | undefined;
  timestamp: Date;
}

export class MessageProducer {
  static async publishMessageEvent(messageData: Omit<MessageEvent, 'eventType' | 'timestamp'>): Promise<void> {
    try {
      const event: MessageEvent = {
        eventType: 'MESSAGE_CREATED',
        ...messageData,
        timestamp: new Date()
      };

      await kafkaProducer.send({
        topic: 'chat-events',
        messages: [{
          key: messageData.groupId,
          value: JSON.stringify(event),
          partition: Math.abs(messageData.groupId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 2
        }]
      });
    } catch (error) {
      console.error('Failed to publish message event:', error);
      throw error;
    }
  }
}