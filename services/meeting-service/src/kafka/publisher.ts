import { kafkaProducer } from './kafkaManager';

export interface MeetingEvent {
  type: 'MEETING_CREATED' | 'MEETING_STARTED' | 'MEETING_ENDED' | 'PARTICIPANT_JOINED' | 'PARTICIPANT_LEFT';
  meetingId: string;
  userId?: number;
  data?: any;
  timestamp: string;
}

export const publishMeetingEvent = async (event: MeetingEvent): Promise<void> => {
  try {
    await kafkaProducer.send({
      topic: 'meeting-events',
      messages: [{
        key: event.meetingId,
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
      }],
    });
  } catch (error) {
    console.error('Failed to publish meeting event:', error);
  }
};