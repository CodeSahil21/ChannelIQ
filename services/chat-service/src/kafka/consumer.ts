import { kafkaConsumer } from './kafkaManager';
import { CreateUserService } from '../services/chat.service';


export const startConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Kafka consumer...');

    // Subscribe to all required topics
    await kafkaConsumer.subscribe({
      topics: ['user-management-events', 'chat-events'],
      fromBeginning: false
    });

    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          // Add heartbeat at the start
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

          // Handle different topics with appropriate handlers
          switch (topic) {
            case 'chat-events':
              await heartbeat();
              await handleChatEvent(parsedMessage);
              await heartbeat();
              break;
              
            default:
              console.warn(`⚠️ Received message from unknown topic: ${topic}`);
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

    console.log('✅ Kafka consumer started successfully');
  } catch (error) {
    console.error('❌ Failed to start consumer:', error);
    throw error;
  }
};

// Define event types
// type UserEvent = {
//   eventType: string;
//   userId: number;
//   email: string;
//   timestamp: Date;
// };

// Update your interface definitions:
interface UserDeletedEvent {
  eventType: 'USER_DELETED';  // Use literal type here
  userId: number;
  email: string;
  timestamp: Date;
}

interface UserProfileCreatedEvent {
  eventType: 'USER_PROFILE_CREATED'; 
  userId: number;
  email: string;
  fullName: string;
  profilePic: string;
  timestamp: Date;
}



type UserManagementEvent = UserDeletedEvent | UserProfileCreatedEvent;



// Handle user-management events
const handleChatEvent = async (event: UserManagementEvent): Promise<void> => {
  try {
    switch (event.eventType) {
      case 'USER_DELETED':
        const deletedUserId = event.userId;
        if (typeof deletedUserId === 'number') {
          // await deleteUserById(deletedUserId);
          console.log(`🗑️ User with ID ${deletedUserId} deleted successfully.`);
        } else {
          console.warn('⚠️ USER_DELETED event missing valid userId:', event);
        }
        break;
        
      case 'USER_PROFILE_CREATED':
        const { userId, email, fullName, profilePic } = event;
        try {
          await CreateUserService({
            userId,
            email,
            fullName,
            profilePic 
          });
          console.log(`👤 User profile created: ${userId} (${fullName})`);
        } catch (serviceError) {
          console.error(`❌ Failed to create user from event:`, serviceError);
          throw serviceError; // Re-throw to be caught by outer try-catch
        }
        break;
        
      default:
        console.warn(`⚠️ Unhandled user management event type: ${(event as any).eventType}`);
        break;
    }
  } catch (error) {
    console.error(`❌ Error handling user management event:`, error);
    throw error;
  }
};

