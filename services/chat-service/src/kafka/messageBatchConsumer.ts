import { kafkaConsumer } from './kafkaManager';
import { MessageEvent } from './messageProducer';
import { MessageBufferService } from '../services/messageBuffer.service';
import { EachMessagePayload } from 'kafkajs';

export const startMessageConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting message batch consumer...');

    await kafkaConsumer.subscribe({
      topics: ['chat-events'],
      fromBeginning: false
    });

    await kafkaConsumer.run({
      eachMessage: async ({ topic, message, heartbeat }: EachMessagePayload) => {
        try {
          await heartbeat();
          
          const value = message.value?.toString();
          if (!value) {
            await heartbeat();
            return;
          }

          const messageEvent: MessageEvent = JSON.parse(value);

          if (messageEvent.eventType === 'MESSAGE_CREATED') {
            MessageBufferService.addMessage(messageEvent);
          }

          await heartbeat();
        } catch (error) {
          console.error(`❌ Error processing message event from ${topic}:`, error);
          await heartbeat();
        }
      }
    });

    console.log('✅ Message batch consumer started successfully');
  } catch (error) {
    console.error('❌ Failed to start message consumer:', error);
    throw error;
  }
};