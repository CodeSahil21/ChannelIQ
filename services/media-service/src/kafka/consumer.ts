import { kafkaConsumer } from './kafkaManager';

export const startConsumer = async (): Promise<void> => {
  try {
    await kafkaConsumer.subscribe({ 
      topics: ['user-events'], 
      fromBeginning: false 
    });

    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value?.toString() || '{}');
          console.log(`📨 Received message from ${topic}:`, eventData);

          // Handle user events if needed for media service
          switch (eventData.eventType) {
            case 'USER_REGISTERED':
              console.log(`👤 User registered: ${eventData.userId} (${eventData.email})`);
              break;
            case 'USER_DELETED':
              // Clean up user's media files
              console.log(`🗑️ User deleted, cleaning up media for user: ${eventData.userId}`);
              break;
            default:
              console.log(`ℹ️ Unhandled event type: ${eventData.eventType}`);
          }

        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      },
    });

    console.log('✅ Media service consumer started successfully');
  } catch (error) {
    console.error('❌ Failed to start consumer:', error);
    throw error;
  }
};