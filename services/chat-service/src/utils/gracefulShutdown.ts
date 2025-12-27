import { MessageBufferService } from '../services/messageBuffer.service';

export const setupGracefulShutdown = (): void => {
  const gracefulShutdown = async (signal: string) => {
    console.log(`📤 Received ${signal}, flushing message buffer...`);
    
    try {
      await MessageBufferService.flushBuffer();
      console.log('✅ Message buffer flushed successfully');
    } catch (error) {
      console.error('❌ Error flushing message buffer:', error);
    }
    
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};