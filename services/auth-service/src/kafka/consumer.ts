import { kafkaConsumer } from './kafkaManager';

export const startConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Kafka consumer...');
    
    await kafkaConsumer.subscribe({
      topics: ['user-management-events'], 
      fromBeginning: false
    });

    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          const value = message.value?.toString();
          if (!value) return;

          const parsedMessage = JSON.parse(value);
          
          console.log(`📨 Received message from ${topic}:${partition}`, {
            key: message.key?.toString(),
            type: parsedMessage.type,
            userId: parsedMessage.data?.userId
          });

          // Only handle user-management events
          if (topic === 'user-management-events') {
            await handleUserManagementEvent(parsedMessage);
          }

          await heartbeat();
          
        } catch (error) {
          console.error(`❌ Error processing message from ${topic}:`, error);
        }
      }
    });

    console.log('✅ Kafka consumer started successfully');
  } catch (error) {
    console.error('❌ Failed to start consumer:', error);
  }
};

type UserManagementEvent = {
  type: 'USER_UPDATED' | 'USER_DELETED'; // Only these two events
  data: {
    userId: string;
    service?: string;
    timestamp?: string;
    firstName?: string;
    email?: string;
    profilePic?: string;
  };
};

const handleUserManagementEvent = async (event: UserManagementEvent): Promise<void> => {
  try {
    console.log(`🔄 Processing user management event: ${event.type}`);
    
    switch (event.type) {
      case 'USER_UPDATED':
        console.log('📝 User profile updated:', event.data.userId);
        // Handle user update logic here
        // e.g., sync user data, update cache, etc.
        break;
        
      case 'USER_DELETED':
        console.log('🗑️ User account deleted:', event.data.userId);
        // Handle user deletion logic here  
        // e.g., clean up user sessions, invalidate tokens, etc.
        break;
        
      default:
        console.warn(`⚠️ Unhandled user management event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`❌ Error handling user management event ${event.type}:`, error);
    throw error;
  }
};