import { kafkaConsumer } from './kafkaManager';


export const startConsumer = async (): Promise<void> => {
  try {
    console.log('🔄 Starting Kafka consumer...');

    // subscribe accepts { topic: string, fromBeginning?: boolean }
    await kafkaConsumer.subscribe({
      topic: 'user-management-events',
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
            type: parsedMessage.type,
            userId: parsedMessage.data?.userId
          });

          if (topic === 'user-management-events') {
            await handleUserManagementEvent(parsedMessage);
          }


        } catch (error) {
          console.error(`❌ Error processing message from ${topic}:`, error);
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