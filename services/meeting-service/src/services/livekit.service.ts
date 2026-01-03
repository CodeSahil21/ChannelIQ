import { AccessToken, VideoGrant, TrackSource } from 'livekit-server-sdk';
import { ParticipantRole } from '@prisma/client';

import { env } from '../config/env';

export class LiveKitService {
  private apiKey: string;
  private apiSecret: string;
  private wsUrl: string;

  constructor() {
    this.apiKey = env.LIVEKIT_API_KEY;
    this.apiSecret = env.LIVEKIT_API_SECRET;
    this.wsUrl = env.LIVEKIT_WS_URL;
  }

  async generateToken(meetingId: string, userId: number, role: ParticipantRole): Promise<string> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: userId.toString(),
      ttl: '10m', // 10 minutes
    });

    const grant = this.getVideoGrant(meetingId, role);
    at.addGrant(grant);

    return await at.toJwt();
  }

  private getVideoGrant(roomName: string, role: ParticipantRole): VideoGrant {
    const baseGrant: VideoGrant = {
      roomJoin: true,
      room: roomName,
      canSubscribe: true,
    };

    switch (role) {
      case 'HOST':
        return {
          ...baseGrant,
          canPublish: true,
          canPublishData: true,
          canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE],
          roomAdmin: true,
        };
      
      case 'CO_HOST':
        return {
          ...baseGrant,
          canPublish: true,
          canPublishData: true,
          canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE],
        };
      
      case 'PARTICIPANT':
        return {
          ...baseGrant,
          canPublish: true, // Allow publishing but controlled by socket events
          canPublishData: true,
          canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE],
        };
      
      default:
        return baseGrant;
    }
  }

  getWsUrl(): string {
    return this.wsUrl;
  }
}