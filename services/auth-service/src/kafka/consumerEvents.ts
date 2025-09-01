import { startConsumer } from './consumer';

export const initializeConsumer = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing user event consumer...');
    await startConsumer();
  } catch (error) {
    console.error('❌ Failed to initialize consumer:', error);
    throw error;
  }
};

