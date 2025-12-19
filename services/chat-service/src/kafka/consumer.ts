import { kafkaConsumer } from './kafkaManager';
import { CreateUserService, updateUserFullName, updateUserProfileUrl, deleteUserById } from '../services/user.service';
import { updateGroupProfileImage } from '../services/group.service';
import { MediaEvent } from '../utils/types';


export const startConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Kafka consumer...');

    // Subscribe to all required topics
    await kafkaConsumer.subscribe({
      topics: ['user-management-events', 'chat-events', 'media-events'],
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
            case 'user-management-events':
              await heartbeat();
              await handleChatEvent(parsedMessage);
              await heartbeat();
              break;
              
            case 'chat-events':
              await heartbeat();
              await handleChatEvent(parsedMessage);
              await heartbeat();
              break;
              
            case 'media-events':
              await heartbeat();
              await handleMediaEvent(parsedMessage);
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

interface UserFullNameUpdatedEvent {
  eventType: 'USER_FULLNAME_UPDATED';
  userId: number;
  fullName: string;
  timestamp: Date;
}

interface UserProfileDeletedEvent {
  eventType: 'USER_PROFILE_DELETED';
  userId: number;
  timestamp: Date;
}

type UserManagementEvent = UserDeletedEvent | UserProfileCreatedEvent | UserFullNameUpdatedEvent | UserProfileDeletedEvent;



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
          throw serviceError;
        }
        break;
        
      case 'USER_FULLNAME_UPDATED':
        try {
          await updateUserFullName(event.userId, event.fullName);
          console.log(`📝 User fullName updated: ${event.userId} -> ${event.fullName}`);
        } catch (serviceError) {
          console.error(`❌ Failed to update user fullName:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'USER_PROFILE_DELETED':
        try {
          await deleteUserById(event.userId);
          console.log(`🗑️ User profile deleted: ${event.userId}`);
        } catch (serviceError) {
          console.error(`❌ Failed to delete user profile:`, serviceError);
          throw serviceError;
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

// Handle media events
const handleMediaEvent = async (event: MediaEvent): Promise<void> => {
  try {
    const userId = parseInt(event.userId);
    
    switch (event.eventType) {
      case 'PROFILE_IMAGE_UPLOADED':
        try {
          await updateUserProfileUrl(userId, event.imageUrl || null);
          console.log(`🖼️ Profile image updated: ${userId} -> ${event.imageUrl}`);
        } catch (serviceError) {
          console.error(`❌ Failed to update profile image:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'PROFILE_IMAGE_DELETED':
        try {
          await updateUserProfileUrl(userId, null);
          console.log(`🗑️ Profile image deleted: ${userId}`);
        } catch (serviceError) {
          console.error(`❌ Failed to delete profile image:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'GROUP_PROFILE_IMAGE_UPLOADED':
        try {
          const groupId = event.metadata?.groupId;
          if (!groupId) {
            console.warn('⚠️ GROUP_PROFILE_IMAGE_UPLOADED event missing groupId');
            break;
          }
          await updateGroupProfileImage(groupId, userId, event.imageUrl || null);
          console.log(`🖼️ Group profile image updated: ${groupId} -> ${event.imageUrl}`);
        } catch (serviceError) {
          console.error(`❌ Failed to update group profile image:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'GROUP_PROFILE_IMAGE_DELETED':
        try {
          const groupId = event.metadata?.groupId;
          if (!groupId) {
            console.warn('⚠️ GROUP_PROFILE_IMAGE_DELETED event missing groupId');
            break;
          }
          await updateGroupProfileImage(groupId, userId, null);
          console.log(`🗑️ Group profile image deleted: ${groupId}`);
        } catch (serviceError) {
          console.error(`❌ Failed to delete group profile image:`, serviceError);
          throw serviceError;
        }
        break;
        
      default:
        console.warn(`⚠️ Unhandled media event type: ${(event as any).eventType}`);
        break;
    }
  } catch (error) {
    console.error(`❌ Error handling media event:`, error);
    throw error;
  }
};

