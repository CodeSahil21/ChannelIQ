import { kafkaConsumer } from './kafkaManager';
import { deleteUserById } from '../services/auth.service';
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


type UserDeletedEvent = {
    eventType: string;
    userId: number;
    email: string;
    timestamp: Date;
};

const handleUserManagementEvent = async (event: UserDeletedEvent): Promise<void> => {
  try {
    if (event.eventType === 'USER_DELETED') {
      const userId = event.userId;
      if (typeof userId === 'number') {
        await deleteUserById(userId);
        console.log(`🗑️ User with ID ${userId} deleted successfully.`);
      } else {
        console.warn('⚠️ USER_DELETED event missing valid userId:', event);
      }
    } else {
      console.warn(`⚠️ Unhandled user management event type: ${event.eventType}`);
    }
  } catch (error) {
    console.error(`❌ Error handling USER_DELETED event:`, error);
    throw error;
  }
};