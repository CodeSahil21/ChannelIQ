import { kafkaConsumer } from './kafkaManager';

export const startConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Kafka consumer...');

    await kafkaConsumer.subscribe({
      topic: 'user-management-events',
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
            type: parsedMessage.type,
            userId: parsedMessage.data?.userId
          });

          if (topic === 'user-management-events') {
            // Add heartbeat before processing
            await heartbeat();
            await handleUserManagementEvent(parsedMessage);
            // Add heartbeat after processing
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


type UserManagementEvent = {
  type: 'USER_UPDATED' | 'USER_DELETED'; // Only these two events
  data: {
    userId: number;
    service?: string;
    timestamp?: string;
    email?: string;
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