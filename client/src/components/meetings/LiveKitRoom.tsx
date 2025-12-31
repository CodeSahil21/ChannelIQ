import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveKitRoom as LiveKitRoomComponent, VideoConference, ControlBar, Chat } from '@livekit/components-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { getLiveKitToken, setLiveKitReady, leaveMeeting } from '../../store/meetingSlice';
import type { Meeting, ParticipantRole } from '../../types/meeting.types';

interface LiveKitRoomProps {
  meeting: Meeting | null;
  userRole: ParticipantRole | null;
}

const LiveKitRoom: React.FC<LiveKitRoomProps> = ({ meeting, userRole }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tokenLoading, liveKitReady } = useAppSelector(state => state.meeting);
  
  const [token, setToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string>('');
  const [showChat, setShowChat] = useState(false);

  const fetchToken = useCallback(async () => {
    if (!meeting || !userRole) return;

    try {
      setConnectionError('');
      const result = await dispatch(getLiveKitToken(meeting.id)).unwrap();
      console.log('LiveKit token result:', result);
      console.log('Token type:', typeof result.token);
      console.log('Token value:', result.token);
      setToken(result.token);
      setWsUrl(result.wsUrl);
    } catch (error) {
      setConnectionError((error as Error).message);
    }
  }, [dispatch, meeting, userRole]);

  useEffect(() => {
    if (meeting?.status === 'LIVE' && userRole) {
      fetchToken();
    }
  }, [meeting?.status, userRole, fetchToken]);

  const handleConnected = useCallback(() => {
    dispatch(setLiveKitReady(true));
  }, [dispatch]);

  const handleDisconnected = useCallback(async () => {
    dispatch(setLiveKitReady(false));
    
    // Call leave meeting API to broadcast the leave event
    if (meeting?.id) {
      try {
        await dispatch(leaveMeeting(meeting.id)).unwrap();
        console.log('🚪 Left meeting via LiveKit disconnect');
      } catch (error) {
        console.error('Error leaving meeting:', error);
      }
    }
    
    // Navigate to meetings page
    navigate('/dashboard');
  }, [dispatch, meeting?.id, navigate]);

  useEffect(() => {
    return () => {
      dispatch(setLiveKitReady(false));
    };
  }, [dispatch]);

  if (!meeting || !userRole) return null;

  if (meeting.status !== 'LIVE') {
    return (
      <div className="livekit-room">
        <div className="livekit-room__waiting">
          <div className="livekit-room__waiting-icon">⏳</div>
          <h3>Meeting Not Started</h3>
          <p>Waiting for the host to start the meeting...</p>
        </div>
      </div>
    );
  }

  if (tokenLoading) {
    return (
      <div className="livekit-room">
        <div className="livekit-room__loading">
          <div className="spinner"></div>
          <h3>Connecting...</h3>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="livekit-room">
        <div className="livekit-room__error">
          <div className="livekit-room__error-icon">⚠️</div>
          <h3>Connection Failed</h3>
          <p>{connectionError}</p>
          <button onClick={fetchToken} className="livekit-room__retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!token || !wsUrl) {
    return (
      <div className="livekit-room">
        <div className="livekit-room__loading">
          <div className="spinner"></div>
          <h3>Getting Access Token...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="livekit-room">
      <LiveKitRoomComponent
        video={true}
        audio={true}
        token={token}
        serverUrl={wsUrl}
        data-lk-theme="default"
        style={{ height: '100%' }}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
      >
        <VideoConference 
          chatMessageFormatter={undefined}
        />
      </LiveKitRoomComponent>
    </div>
  );
};

export default LiveKitRoom;