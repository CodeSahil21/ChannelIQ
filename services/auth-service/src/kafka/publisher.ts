import {kafkaProducer } from './kafkaManager';
import {createUserRegistrationEvent,createLoggedInUserEvent,createLoggedOutUserEvent} from './userEvents';

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
            key:userData.userId.toString(),
            value:JSON.stringify(event),
            headers:{
                eventType: 'USER_REGISTERED',
                serviceId: 'auth-service',
                version: '1.0'
            }
        }]
    });
    // console.log('✅ User registered event published:', userData.userId);
   } catch (error) {
      console.error('❌ Failed to publish user registered event:', error);
      // In production, you might want to implement retry logic or dead letter queue
      throw new Error(`Event publishing failed: ${error}`);
   }
  }



async publishUserLoggedIn(userData: {
    userId: number;
    email: string;
}): Promise<void> {
    try {
        const event = createLoggedInUserEvent(userData);

        await kafkaProducer.send({
            topic: this.USER_EVENTS_TOPIC,
            messages: [{
                key: userData.userId.toString(),
                value: JSON.stringify(event),
                headers: {
                    eventType: 'USER_LOGGED_IN',
                    serviceId: 'auth-service',
                    version: '1.0'
                }
            }]
        });
        // console.log('✅ User logged in event published:', userData.userId);
    } catch (error) {
        console.error('❌ Failed to publish user logged in event:', error);
        throw new Error(`Event publishing failed: ${error}`);
    }
}

async publishUserLoggedOut(userData: {
    userId: number;
    email: string;
}): Promise<void> {
    try {
        const event = createLoggedOutUserEvent(userData);

        await kafkaProducer.send({
            topic: this.USER_EVENTS_TOPIC,
            messages: [{
                key: userData.userId.toString(),
                value: JSON.stringify(event),
                headers: {
                    eventType: 'USER_LOGGED_OUT',
                    serviceId: 'auth-service',
                    version: '1.0'
                }
            }]
        });
        // console.log('✅ User logged out event published:', userData.userId);
    } catch (error) {
        console.error('❌ Failed to publish user logged out event:', error);
        throw new Error(`Event publishing failed: ${error}`);
    }
}
}

export const eventPublisher = new EventPublisher();