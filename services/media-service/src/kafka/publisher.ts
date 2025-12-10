import { kafkaProducer } from './kafkaManager';

export interface MediaEvent {
  eventType: 'PROFILE_IMAGE_UPLOADED' | 'PROFILE_IMAGE_DELETED';
  userId: string;
  imageUrl?: string;
  timestamp: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    originalName?: string;
  };
}

export const publishMediaEvent = async (event: MediaEvent): Promise<void> => {
  try {
    const message = {
      topic: 'media-events',
      messages: [{
        key: event.userId,
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
        headers: {
          eventType: event.eventType,
          userId: event.userId,
          source: 'media-service'
        }
      }]
    };

    await kafkaProducer.send(message);
    console.log(`✅ Media event published: ${event.eventType} for user ${event.userId}`);
    
  } catch (error) {
    console.error('❌ Failed to publish media event:', error);
    throw error;
  }
};