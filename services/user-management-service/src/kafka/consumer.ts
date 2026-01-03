import { kafkaConsumer } from './kafkaManager';
import { CreateUserService, updateUserProfileImage } from '../services/profile.service';
import {handleUserLoggedInEvent,handleUserLoggedOutEvent} from '../services/events.service';
import { UserLoggedInEventType,UserLoggedOutEventType,UserRegisteredEvent } from '../utils/types';

export const startConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Kafka consumer for user-events...');

    await kafkaConsumer.subscribe({
      topics: ['user-events', 'media-events'],
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

          // console.log(`📨 Received message from ${topic}:${partition}`, {
          //   key: message.key?.toString(),
          //   eventType: parsedMessage.eventType,
          //   userId: parsedMessage.userId
          // });

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

            case 'PROFILE_IMAGE_UPLOADED':
              await heartbeat();
              await handleProfileImageUploadedEvent(parsedMessage);
              await heartbeat();
              break;

            case 'PROFILE_IMAGE_DELETED':
              await heartbeat();
              await handleProfileImageDeletedEvent(parsedMessage);
              await heartbeat();
              break;

            default:
              console.log("");
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



const handleUserRegisteredEvent = async (event: UserRegisteredEvent): Promise<void> => {
    try {
        console.log(`👤 Processing USER_REGISTERED event for user`);
        await CreateUserService({userId: event.userId, email: event.email});
        console.log(`✅ User  created successfully`);
    } catch (error) {
        console.error(`❌ Failed to handle USER_REGISTERED event for user:`, error);
        throw error;
    }
};

const handleUserLoggedInEventWrapper = async (event: UserLoggedInEventType): Promise<void> => {
    try {
        console.log(`🔑 Processing USER_LOGGED_IN event for user `);
        await handleUserLoggedInEvent(event.userId);
        console.log(`✅ User marked as online`);
    } catch (error) {
        console.error(`❌ Failed to handle USER_LOGGED_IN event for user:`, error);
        throw error;
    }
};

const handleUserLoggedOutEventWrapper = async (event: UserLoggedOutEventType): Promise<void> => {
    try {
        console.log(`🚪 Processing USER_LOGGED_OUT event for user`);
        await handleUserLoggedOutEvent(event.userId);
        console.log(`✅ User marked as offline`);
    } catch (error) {
        console.error(`❌ Failed to handle USER_LOGGED_OUT event for user:`, error);
        throw error;
    }
};

const handleProfileImageUploadedEvent = async (event: any): Promise<void> => {
    try {
        console.log(`🖼️ Processing PROFILE_IMAGE_UPLOADED event for user `);

        const fileName = event.metadata?.fileName || event.imageUrl?.split('/').pop()?.split('?')[0];
        await updateUserProfileImage(parseInt(event.userId), fileName);
        console.log(`✅ Profile image updated for user `);
    } catch (error) {
        console.error(`❌ Failed to handle PROFILE_IMAGE_UPLOADED event for user :`, error);
        throw error;
    }
};

const handleProfileImageDeletedEvent = async (event: any): Promise<void> => {
    try {
        console.log(`🗑️ Processing PROFILE_IMAGE_DELETED event for user `);
        await updateUserProfileImage(parseInt(event.userId), null);
        console.log(`✅ Profile image removed for user `);
    } catch (error) {
        console.error(`❌ Failed to handle PROFILE_IMAGE_DELETED event for user :`, error);
        throw error;
    }
};