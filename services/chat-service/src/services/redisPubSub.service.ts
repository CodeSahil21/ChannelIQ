import { pubClient, subClient } from '../redis';
import { TypedServer } from '../socket/types';

export class RedisPubSubService {
  private static instanceId = `instance-${process.pid}-${Date.now()}`;
  private static initialized = false;

  static async initialize(io: TypedServer): Promise<void> {
    if (this.initialized) return;

    try {
      // Subscribe to all chat events
      await subClient.pSubscribe('chat:*', (message) => {
        try {
          const { type, room, data, instanceId } = JSON.parse(message);
          
          // Only emit if message came from different instance
          if (instanceId !== this.instanceId) {
            io.to(room).emit(type, data);
          }
        } catch (error) {
          console.error('Error processing cross-instance event:', error);
        }
      });

      this.initialized = true;
      console.log('Redis pub/sub initialized for cross-instance messaging');
    } catch (error) {
      console.error('Failed to initialize Redis pub/sub:', error);
    }
  }

  static async publishEvent(type: string, room: string, data: any): Promise<void> {
    try {
      const event = { type, room, data, instanceId: this.instanceId };
      const channel = `chat:${room.replace('group:', '')}`;
      await pubClient.publish(channel, JSON.stringify(event));
    } catch (error) {
      console.error('Failed to publish cross-instance event:', error);
    }
  }

  static async publishToGroup(groupId: string, eventType: string, data: any): Promise<void> {
    await this.publishEvent(eventType, `group:${groupId}`, data);
  }
}