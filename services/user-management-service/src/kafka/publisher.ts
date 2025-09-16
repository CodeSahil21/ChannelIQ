import {kafkaProducer } from './kafkaManager';
import {createUserDeletedEvent} from './userEvents';

class EventPublisher {
    //Topic name for all user-related events
    private readonly  USER_MANAGEMENT_EVENTS_TOPIC = 'user-management-events';

     async publishUserDeleted( userData: {
    userId: number;
    email: string;
}): Promise<void> {
        try {
            const event = createUserDeletedEvent(userData);
            
            await kafkaProducer.send({
                topic: this.USER_MANAGEMENT_EVENTS_TOPIC,
                messages: [{
                    key:userData.userId.toString(),
                    value: JSON.stringify(event),
                    headers: {
                        eventType: 'USER_DELETED',
                        source: 'user-management-service',
                        version: '1.0'
                    }
                }]
            });

            console.log(`Published user_deleted event for user ${userData.userId}`);
        } catch (error) {
            console.error('Failed to publish user deleted event:', error);
            throw error;
        }
    }
}

export const eventPublisher = new EventPublisher();