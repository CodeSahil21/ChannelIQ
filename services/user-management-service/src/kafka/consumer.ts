import { kafkaConsumer } from './kafkaManager';
import { CreateUserService } from '../services/user-management.service';

export const startConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Kafka consumer for user-events...');

    await kafkaConsumer.subscribe({
      topic: 'user-events',
      fromBeginning: false
    });

    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value?.toString();
          if (!value) return;

          const parsedMessage = JSON.parse(value);

          console.log(`📨 Received message from ${topic}:${partition}`, {
            key: message.key?.toString(),
            eventType: parsedMessage.eventType,
            userId: parsedMessage.userId
          });

          if (parsedMessage.eventType === 'USER_REGISTERED') {
            await handleUserRegisteredEvent(parsedMessage);
          }

        } catch (error) {
          console.error(`❌ Error processing message from ${topic}:`, error);
        }
      }
    });

    console.log('✅ Kafka consumer for user-events started successfully');
  } catch (error) {
    console.error('❌ Failed to start user-events consumer:', error);
    throw error;
  }
};

type UserRegisteredEvent = {
  eventType: 'USER_REGISTERED';
  userId: number;
  email: string;
  timestamp: Date;
};

const handleUserRegisteredEvent = async (event: UserRegisteredEvent): Promise<void> => {
    await CreateUserService({userId: event.userId, email: event.email});
};
