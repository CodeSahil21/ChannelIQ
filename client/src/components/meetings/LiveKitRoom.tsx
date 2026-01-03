import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveKitRoom as LiveKitRoomComponent, VideoConference, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { getLiveKitToken, setLiveKitReady, leaveMeeting, participantMuted, participantUnmuted, participantCameraDisabled, participantCameraEnabled, participantScreenShareStarted, participantScreenShareStopped } from '../../store/meetingSlice';
import { useMeetingSocket } from '../../hooks/useMeetingSocket';
import type { Meeting, ParticipantRole } from '../../types/meeting.types';

interface LiveKitRoomProps {
  meeting: Meeting | null;
  userRole: ParticipantRole | null;
}

const LiveKitRoom: React.FC<LiveKitRoomProps> = ({ meeting, userRole }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tokenLoading, liveKitReady, mutedParticipants, cameraDisabledParticipants, screenSharingParticipants } = useAppSelector(state => state.meeting);
  const currentUser = useAppSelector(state => state.user.user);
  const { requestUnmute } = useMeetingSocket(meeting?.id || null);
  
  const [token, setToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string>('');
  const [showChat, setShowChat] = useState(false);

  const fetchToken = useCallback(async () => {
    if (!meeting || !userRole) return;

    try {
      setConnectionError('');
      const result = await dispatch(getLiveKitToken(meeting.id)).unwrap();
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
      } catch (error) {
        // Error handled silently
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
        <MediaControlHandler 
          currentUserId={currentUser?.id || 0}
          mutedParticipants={mutedParticipants}
          cameraDisabledParticipants={cameraDisabledParticipants}
          screenSharingParticipants={screenSharingParticipants}
          requestUnmute={requestUnmute}
        />
        <VideoConference 
          chatMessageFormatter={undefined}
        />
      </LiveKitRoomComponent>
    </div>
  );
};

// Component to handle all media controls based on socket events
const MediaControlHandler: React.FC<{
  currentUserId: number;
  mutedParticipants: number[];
  cameraDisabledParticipants: number[];
  screenSharingParticipants: number[];
  requestUnmute: () => void;
}> = ({ currentUserId, mutedParticipants, cameraDisabledParticipants, screenSharingParticipants, requestUnmute }) => {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [isLocallyMuted, setIsLocallyMuted] = useState(false);
  const [isCameraDisabled, setIsCameraDisabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    const shouldBeMuted = mutedParticipants.includes(currentUserId);
    
    if (shouldBeMuted && !isLocallyMuted) {
      localParticipant.setMicrophoneEnabled(false);
      setIsLocallyMuted(true);
    } else if (!shouldBeMuted && isLocallyMuted) {
      localParticipant.setMicrophoneEnabled(true);
      setIsLocallyMuted(false);
    }
  }, [mutedParticipants, currentUserId, localParticipant, isLocallyMuted]);

  useEffect(() => {
    const shouldCameraBeDisabled = cameraDisabledParticipants.includes(currentUserId);
    
    if (shouldCameraBeDisabled && !isCameraDisabled) {
      localParticipant.setCameraEnabled(false);
      setIsCameraDisabled(true);
    } else if (!shouldCameraBeDisabled && isCameraDisabled) {
      localParticipant.setCameraEnabled(true);
      setIsCameraDisabled(false);
    }
  }, [cameraDisabledParticipants, currentUserId, localParticipant, isCameraDisabled]);

  useEffect(() => {
    const shouldScreenShare = screenSharingParticipants.includes(currentUserId);
    
    if (shouldScreenShare && !isScreenSharing) {
      localParticipant.setScreenShareEnabled(true);
      setIsScreenSharing(true);
    } else if (!shouldScreenShare && isScreenSharing) {
      localParticipant.setScreenShareEnabled(false);
      setIsScreenSharing(false);
    }
  }, [screenSharingParticipants, currentUserId, localParticipant, isScreenSharing]);

  // Store room reference globally for socket handlers
  useEffect(() => {
    if (room) {
      (window as any).livekitRoom = room;
    }
  }, [room]);

  return null; // This component doesn't render anything
};

export default LiveKitRoom;