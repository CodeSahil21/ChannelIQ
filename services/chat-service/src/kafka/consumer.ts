import { kafkaConsumer } from './kafkaManager';
import { CreateUserService, updateUserFullName, updateUserProfileUrl, deleteUserById } from '../services/user.service';
import { updateGroupProfileImage } from '../services/group.service';
import { SocketMessageService } from '../services/socket.service';
import { getSocketServer } from '../socket/emitters';
import { MediaEvent } from '../utils/types';
import { EachMessagePayload } from 'kafkajs';
import { MessageEvent } from './messageProducer';
import { MessageBufferService } from '../services/messageBuffer.service';


export const startConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Kafka consumer...');

    await kafkaConsumer.subscribe({
      topics: ['user-management-events', 'chat-events', 'media-events', 'message-events'],
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

          const parsedMessage = JSON.parse(value);

          // if (config.KAFKA_DEBUG) {
          //   console.log(`📨 Received message from ${topic}:${partition}`, {
          //     key: message.key?.toString(),
          //     eventType: parsedMessage.eventType,
          //     userId: parsedMessage.userId
          //   });
          // }

          switch (topic) {
            case 'user-management-events':
              await heartbeat();
              // Legacy topic - no longer used
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
              
            case 'message-events':
              await heartbeat();
              await handleMessageEvent(parsedMessage);
              await heartbeat();
              break;
              
            default:
              console.warn(`⚠️ Unhandled topic: ${topic}`);
              await heartbeat();
          }

        } catch (error) {
          console.error(`❌ Error processing message from ${topic}:`, error);
          try {
            await heartbeat();
          } catch (hbError) {
            console.error('❌ Heartbeat failed:', hbError);
          }
        }
      }
    });

    console.log('✅ Kafka consumer started successfully');
  } catch (error) {
    console.error('❌ Failed to start consumer:', error);
    throw error;
  }
};

interface UserDeletedEvent {
  eventType: 'USER_DELETED';
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
  email: string;
  fullName: string;
  profilePic: string;
  timestamp: Date;
}

interface UserProfileDeletedEvent {
  eventType: 'USER_PROFILE_DELETED';
  userId: number;
  timestamp: Date;
}

interface UserProfileUpdatedEvent {
  eventType: 'USER_PROFILE_UPDATED';
  userId: number;
  email: string;
  fullName: string;
  profilePic: string;
  timestamp: Date;
}

type UserManagementEvent = UserDeletedEvent | UserProfileCreatedEvent | UserFullNameUpdatedEvent | UserProfileDeletedEvent | UserProfileUpdatedEvent;

const handleChatEvent = async (event: UserManagementEvent): Promise<void> => {
  try {
    switch (event.eventType) {
      case 'USER_PROFILE_CREATED':
        const { userId, email, fullName, profilePic } = event;
        try {
          await CreateUserService({
            userId,
            email,
            fullName,
            profilePic 
          });
          console.log(`👤 User profile created in chat-service: ${userId} (${fullName})`);
        } catch (serviceError) {
          console.error(`❌ Failed to create user from chat event:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'USER_FULLNAME_UPDATED':
        try {
          await updateUserFullName(event.userId, event.fullName, event.email, event.profilePic);
          console.log(`📝 User fullName updated in chat-service: ${event.userId} -> ${event.fullName}`);
        } catch (serviceError) {
          console.error(`❌ Failed to update user fullName from chat event:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'USER_PROFILE_UPDATED':
        try {
          await CreateUserService({
            userId: event.userId,
            email: event.email,
            fullName: event.fullName,
            profilePic: event.profilePic 
          });
          console.log(`🔄 User profile updated in chat-service: ${event.userId} (${event.fullName})`);
        } catch (serviceError) {
          console.error(`❌ Failed to update user profile from chat event:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'USER_PROFILE_DELETED':
        try {
          await deleteUserById(event.userId);
          console.log(`🗑️ User profile deleted in chat-service: ${event.userId}`);
        } catch (serviceError) {
          console.error(`❌ Failed to delete user profile from chat event:`, serviceError);
          throw serviceError;
        }
        break;
        
      default:
        console.warn(`⚠️ Unhandled chat event type: ${(event as any).eventType}`);
        break;
    }
  } catch (error) {
    console.error(`❌ Error handling chat event:`, error);
    throw error;
  }
};


const handleMediaEvent = async (event: MediaEvent): Promise<void> => {
  try {
    const userId = typeof event.userId === 'string' ? parseInt(event.userId, 10) : event.userId;
    
    switch (event.eventType) {
      case 'PROFILE_IMAGE_UPLOADED':
        try {
          await updateUserProfileUrl(userId, event.imageUrl || null);
          // console.log(`🖼️ Profile image updated: ${userId} -> ${event.imageUrl}`);
        } catch (serviceError) {
          console.error(`❌ Failed to update profile image:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'PROFILE_IMAGE_DELETED':
        try {
          await updateUserProfileUrl(userId, null);
          // console.log(`🗑️ Profile image deleted: ${userId}`);
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
          // console.log(`🖼️ Group profile image updated: ${groupId} -> ${event.imageUrl}`);
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
          // console.log(`🗑️ Group profile image deleted: ${groupId}`);
        } catch (serviceError) {
          console.error(`❌ Failed to delete group profile image:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'MESSAGE_FILE_UPLOADED':
        try {
          const groupId = event.metadata?.groupId;
          const messageType = event.metadata?.messageType || 'FILE';
          const fileUrl = event.imageUrl;
          
          if (!groupId) {
            console.warn('⚠️ MESSAGE_FILE_UPLOADED event missing groupId');
            break;
          }

          if (!fileUrl) {
            console.warn('⚠️ MESSAGE_FILE_UPLOADED event missing fileUrl');
            break;
          }

          const message = await SocketMessageService.createMessage({
            content: event.metadata?.originalName || 'File',
            type: messageType as any,
            fileUrl,
            groupId,
            senderId: userId
          });

          const io = getSocketServer();
          if (io) {
            io.to(`group:${groupId}`).emit('message:persisted', {
              ...message,
              reactions: [],
              statuses: []
            });
          }

          // console.log(`📎 Message file uploaded: ${groupId} -> ${event.imageUrl}`);
        } catch (serviceError) {
          console.error(`❌ Failed to handle message file upload:`, serviceError);
          throw serviceError;
        }
        break;
        
      case 'MESSAGE_FILE_DELETED':
        try {
          const groupId = event.metadata?.groupId;
          const fileName = event.metadata?.fileName;
          
          if (!groupId || !fileName) {
            console.warn('⚠️ MESSAGE_FILE_DELETED event missing groupId or fileName');
            break;
          }

          // Emit file deletion to Socket.IO
          const io = getSocketServer();
          if (io) {
            (io as any).to(`group:${groupId}`).emit('message:file:deleted', {
              groupId,
              fileName,
              deletedBy: userId
            });
          }

          // console.log(`🗑️ Message file deleted: ${groupId} -> ${fileName}`);
        } catch (serviceError) {
          console.error(`❌ Failed to handle message file deletion:`, serviceError);
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

const handleMessageEvent = async (event: MessageEvent): Promise<void> => {
  try {
    if (event.eventType === 'MESSAGE_CREATED') {
      MessageBufferService.addMessage(event);
    }
  } catch (error) {
    console.error(`❌ Error handling message event:`, error);
    throw error;
  }
};