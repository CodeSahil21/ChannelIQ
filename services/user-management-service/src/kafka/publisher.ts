import {kafkaProducer } from './kafkaManager';
import {createUserDeletedEvent,createUserProfileCreatedEvent, createUserFullNameUpdatedEvent, createUserProfileDeletedEvent} from './userEvents';

class EventPublisher {
    //Topic name for all user-related events
    private readonly  USER_EVENTS_TOPIC = 'user-events';
    private readonly  CHAT_EVENTS_TOPIC = 'chat-events';

     async publishUserDeleted( userData: {
    userId: number;
    email: string;
}): Promise<void> {
        try {
            const event = createUserDeletedEvent(userData);
            
            await kafkaProducer.send({
                topic: this.USER_EVENTS_TOPIC,
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

            console.log(`Published user_deleted event for user `);
        } catch (error) {
            console.error('Failed to publish user deleted event:', error);
            throw error;
        }
    }

async publishUserProfileCreated(userData: {
    userId: number;
    email: string;
    fullName: string;
    profilePic: string;
}): Promise<void> {
    try {
        const event = createUserProfileCreatedEvent(userData);
        await kafkaProducer.send({
            topic: this.CHAT_EVENTS_TOPIC,  
            messages: [{
                key: userData.userId.toString(),
                value: JSON.stringify(event),
                headers: {
                    eventType: 'USER_PROFILE_CREATED',
                    source: 'user-management-service',
                    targetService: 'chat-service',  
                    version: '1.0'
                }
            }]
        });

        console.log(`Published USER_PROFILE_CREATED event for user ${userData.userId} (${userData.fullName}) to chat service`);
    } catch (error) {
        console.error('Failed to publish user profile created event:', error);
        throw error;
    }
}

async publishUserFullNameUpdated(userData: {
    userId: number;
    email: string;
    fullName: string;
    profilePic: string;
}): Promise<void> {
    try {
        const event = createUserFullNameUpdatedEvent(userData);
        await kafkaProducer.send({
            topic: this.CHAT_EVENTS_TOPIC,
            messages: [{
                key: userData.userId.toString(),
                value: JSON.stringify(event),
                headers: {
                    eventType: 'USER_FULLNAME_UPDATED',
                    source: 'user-management-service',
                    targetService: 'chat-service',
                    version: '1.0'
                }
            }]
        });

        console.log(`Published USER_FULLNAME_UPDATED event for user ${userData.userId} (${userData.fullName}) to chat service`);
    } catch (error) {
        console.error('Failed to publish user fullName updated event:', error);
        throw error;
    }
}

async publishUserProfileUpdated(userData: {
    userId: number;
    email: string;
    fullName: string;
    profilePic: string;
}): Promise<void> {
    try {
        const event = createUserProfileCreatedEvent(userData); // Reuse same event structure
        await kafkaProducer.send({
            topic: this.CHAT_EVENTS_TOPIC,
            messages: [{
                key: userData.userId.toString(),
                value: JSON.stringify({
                    ...event,
                    eventType: 'USER_PROFILE_UPDATED'
                }),
                headers: {
                    eventType: 'USER_PROFILE_UPDATED',
                    source: 'user-management-service',
                    targetService: 'chat-service',
                    version: '1.0'
                }
            }]
        });

        console.log(`Published USER_PROFILE_UPDATED event for user ${userData.userId} (${userData.fullName}) to chat service`);
    } catch (error) {
        console.error('Failed to publish user profile updated event:', error);
        throw error;
    }
}

async publishUserProfileDeleted(userData: {
    userId: number;
}): Promise<void> {
    try {
        const event = createUserProfileDeletedEvent(userData);
        await kafkaProducer.send({
            topic: this.CHAT_EVENTS_TOPIC,
            messages: [{
                key: userData.userId.toString(),
                value: JSON.stringify(event),
                headers: {
                    eventType: 'USER_PROFILE_DELETED',
                    source: 'user-management-service',
                    targetService: 'chat-service',
                    version: '1.0'
                }
            }]
        });

        console.log(`Published USER_PROFILE_DELETED event for user ${userData.userId} to chat service`);
    } catch (error) {
        console.error('Failed to publish user profile deleted event:', error);
        throw error;
    }
}
}

export const eventPublisher = new EventPublisher();