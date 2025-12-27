import { MessageEvent } from '../kafka/messageProducer';
import { MessageBatchService, BulkMessageData } from './messageBatch.service';
import { getSocketServer } from '../socket/emitters';

export class MessageBufferService {
  private static messageBuffer: MessageEvent[] = [];
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static readonly BATCH_TIMEOUT_MS = parseInt(process.env.MESSAGE_BATCH_TIMEOUT || '5000'); // 5 seconds default
  private static readonly MAX_BATCH_SIZE = parseInt(process.env.MESSAGE_MAX_BATCH_SIZE || '100'); // Safety limit

  static addMessage(messageEvent: MessageEvent): void {
    this.messageBuffer.push(messageEvent);

    // Safety check: if buffer gets too large, process immediately
    if (this.messageBuffer.length >= this.MAX_BATCH_SIZE) {
      this.processBatch();
    } else if (!this.batchTimeout) {
      // Start timer for batch processing
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_TIMEOUT_MS);
    }
  }

  private static async processBatch(): Promise<void> {
    if (this.messageBuffer.length === 0) return;

    const batch = [...this.messageBuffer];
    this.messageBuffer = [];
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      const bulkData: BulkMessageData[] = batch.map(event => ({
        id: event.messageId,
        ...(event.content && { content: event.content }),
        type: event.type,
        ...(event.fileUrl && { fileUrl: event.fileUrl }),
        groupId: event.groupId,
        senderId: event.senderId,
        ...(event.replyToId && { replyToId: event.replyToId }),
        createdAt: event.timestamp
      }));

      await MessageBatchService.bulkCreateMessages(bulkData);

      // Emit persisted events after successful DB insert
      const io = getSocketServer();
      if (io) {
        for (const event of batch) {
          io.to(`group:${event.groupId}`).emit('message:bulk_persisted', {
            messageId: event.messageId,
            groupId: event.groupId
          });
        }
      }

      console.log(`✅ Processed batch of ${batch.length} messages`);
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      // Could implement retry logic here
    }
  }

  static async flushBuffer(): Promise<void> {
    if (this.messageBuffer.length > 0) {
      await this.processBatch();
    }
  }
}