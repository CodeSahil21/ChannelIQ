import {kafkaProducer } from './kafkaManager';
import {createUserRegistrationEvent} from './userEvents';

class EventPublisher {
    //Topic name for all user-related events
    private readonly  USER_EVENTS_TOPIC = 'user-events';

   /**
   * Publishes user registration event to Kafka
   * This event will be consumed by other services to create user records
   */
  async publishUserRegistered(userData:{
     userId:number;
     email:string;
  }): Promise<void> {
   try{
    const event = createUserRegistrationEvent(userData);

    await kafkaProducer.send({
        topic:this.USER_EVENTS_TOPIC,
        messages: [{
            key:userData.userId.toString(),// Partition key for ordering
            value:JSON.stringify(event),
            headers:{
                eventType: 'USER_REGISTERED',
                serviceId: 'auth-service',
                version: '1.0'
            }
        }]
    });
    console.log('✅ User registered event published:', userData.userId);
   } catch (error) {
      console.error('❌ Failed to publish user registered event:', error);
      // In production, you might want to implement retry logic or dead letter queue
      throw new Error(`Event publishing failed: ${error}`);
   }
  }
}

export const eventPublisher = new EventPublisher();