import { kafkaConsumer } from './kafkaManager';
import { CreateUserService } from '../services/profile.service';
import {handleUserLoggedInEvent,handleUserLoggedOutEvent} from '../services/events.service';

export const startConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Kafka consumer for user-events...');

    await kafkaConsumer.subscribe({
      topic: 'user-events',
      fromBeginning: false
    });

    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          // Call heartbeat at the start
          await heartbeat();
          
          const value = message.value?.toString();
          if (!value) {
            await heartbeat(); // Even for empty messages
            return;
          }

          const parsedMessage = JSON.parse(value);

          console.log(`📨 Received message from ${topic}:${partition}`, {
            key: message.key?.toString(),
            eventType: parsedMessage.eventType,
            userId: parsedMessage.userId
          });

          // Handle different event types with switch statement
          switch (parsedMessage.eventType) {
            case 'USER_REGISTERED':
              await heartbeat();
              await handleUserRegisteredEvent(parsedMessage);
              await heartbeat();
              break;

            case 'USER_LOGGED_IN':
              await heartbeat();
              await handleUserLoggedInEventWrapper(parsedMessage);
              await heartbeat();
              break;

            case 'USER_LOGGED_OUT':
              await heartbeat();
              await handleUserLoggedOutEventWrapper(parsedMessage);
              await heartbeat();
              break;

            default:
              console.log(`⚠️ Unknown event type: ${parsedMessage.eventType}`);
              await heartbeat();
          }

        } catch (error) {
          console.error(`❌ Error processing message from ${topic}:`, error);
          // Still call heartbeat on error to maintain session
          try {
            await heartbeat();
          } catch (hbError) {
            console.error('❌ Heartbeat failed:', hbError);
          }
          // Don't throw - let consumer continue with next message
        }
      }
    });

    console.log('✅ Kafka consumer for user-events started successfully');
  } catch (error) {
    console.error('❌ Failed to start user-events consumer:', error);
    throw error;
  }
};

// Event type definitions
type UserRegisteredEvent = {
  eventType: 'USER_REGISTERED';
  userId: number;
  email: string;
  timestamp: Date;
};

type UserLoggedInEventType = {
  eventType: 'USER_LOGGED_IN';
  userId: number;
  email: string;
  timestamp: Date;
};

type UserLoggedOutEventType = {
  eventType: 'USER_LOGGED_OUT';
  userId: number;
  email: string;
  timestamp: Date;
};

const handleUserRegisteredEvent = async (event: UserRegisteredEvent): Promise<void> => {
    try {
        console.log(`👤 Processing USER_REGISTERED event for user ${event.userId}`);
        await CreateUserService({userId: event.userId, email: event.email});
        console.log(`✅ User ${event.userId} created successfully`);
    } catch (error) {
        console.error(`❌ Failed to handle USER_REGISTERED event for user ${event.userId}:`, error);
        throw error;
    }
};

const handleUserLoggedInEventWrapper = async (event: UserLoggedInEventType): Promise<void> => {
    try {
        console.log(`🔑 Processing USER_LOGGED_IN event for user ${event.userId}`);
        await handleUserLoggedInEvent(event.userId);
        console.log(`✅ User ${event.userId} marked as online`);
    } catch (error) {
        console.error(`❌ Failed to handle USER_LOGGED_IN event for user ${event.userId}:`, error);
        throw error;
    }
};

const handleUserLoggedOutEventWrapper = async (event: UserLoggedOutEventType): Promise<void> => {
    try {
        console.log(`🚪 Processing USER_LOGGED_OUT event for user ${event.userId}`);
        await handleUserLoggedOutEvent(event.userId);
        console.log(`✅ User ${event.userId} marked as offline`);
    } catch (error) {
        console.error(`❌ Failed to handle USER_LOGGED_OUT event for user ${event.userId}:`, error);
        throw error;
    }
};