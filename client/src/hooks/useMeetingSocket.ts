import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './useAppDispatch';
import { updateParticipant, removeParticipant, updateMeetingStatus, socketParticipantJoined, socketParticipantLeft, socketParticipantRoleChanged, socketMeetingStatusChanged, participantMuted, participantUnmuted, addUnmuteRequest, participantCameraDisabled, participantCameraEnabled, participantScreenShareStarted, participantScreenShareStopped } from '../store/meetingSlice';
import type { ParticipantRole } from '../types/meeting.types';
import type { RootState } from '../store';

export const useMeetingSocket = (meetingId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentUser = useSelector((state: RootState) => state.user.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!currentUser?.id || !meetingId) {
      return;
    }
    const newSocket = io('http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      path: '/meeting-socket/',
      forceNew: true // Force new connection to avoid cache
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    newSocket.on('participantJoined', (data) => {
      dispatch(socketParticipantJoined({
        id: data.userId,
        meetingId: data.meetingId,
        userId: data.userId,
        role: data.role as ParticipantRole,
        joinedAt: data.timestamp,
        userName: data.userName,
        userEmail: data.userEmail
      }));
    });

    newSocket.on('participantLeft', (data) => {
      dispatch(socketParticipantLeft(data.userId));
    });

    newSocket.on('participantRoleChanged', (data) => {
      dispatch(socketParticipantRoleChanged({
        userId: data.userId,
        newRole: data.newRole as ParticipantRole
      }));
    });

    newSocket.on('meetingStarted', (data) => {
      dispatch(socketMeetingStatusChanged('LIVE'));
    });

    newSocket.on('meetingEnded', (data) => {
      dispatch(socketMeetingStatusChanged('ENDED'));
    });

    newSocket.on('participantMuted', (data) => {
      if (data.targetUserId === currentUser?.id) {
        const room = (window as any).livekitRoom;
        if (room) {
          room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
        }
      }
      dispatch(participantMuted(data.targetUserId));
    });

    newSocket.on('participantUnmuted', (data) => {
      if (data.targetUserId === currentUser?.id) {
        const room = (window as any).livekitRoom;
        if (room) {
          room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
        }
      }
      dispatch(participantUnmuted(data.targetUserId));
    });

    const setupLiveKitListeners = () => {
      const room = (window as any).livekitRoom;
      if (room && room.on) {
        try {
          room.off('trackMuted');
          room.off('trackUnmuted');
          room.off('trackPublished');
          room.off('trackUnpublished');
        } catch (e) {
          // Ignore errors if listeners don't exist
        }
        
        room.on('trackMuted', (track: any, participant: any) => {
          if (track.kind === 'audio') {
            dispatch(participantMuted(parseInt(participant.identity)));
          }
        });
        
        room.on('trackUnmuted', (track: any, participant: any) => {
          if (track.kind === 'audio') {
            dispatch(participantUnmuted(parseInt(participant.identity)));
          }
        });
        
        room.on('trackPublished', (track: any, participant: any) => {
          if (track.kind === 'video' && track.source === 'camera') {
            dispatch(participantCameraEnabled(parseInt(participant.identity)));
          } else if (track.source === 'screen_share') {
            dispatch(participantScreenShareStarted(parseInt(participant.identity)));
          }
        });
        
        room.on('trackUnpublished', (track: any, participant: any) => {
          if (track.kind === 'video' && track.source === 'camera') {
            dispatch(participantCameraDisabled(parseInt(participant.identity)));
          } else if (track.source === 'screen_share') {
            dispatch(participantScreenShareStopped(parseInt(participant.identity)));
          }
        });
      }
    };

    const checkRoom = setInterval(() => {
      if ((window as any).livekitRoom) {
        setupLiveKitListeners();
        clearInterval(checkRoom);
      }
    }, 1000);

    newSocket.on('unmuteRequested', (data) => {
      dispatch(addUnmuteRequest({
        userId: data.userId,
        userName: data.userName || `User ${data.userId}`,
        timestamp: data.timestamp
      }));
    });

    newSocket.on('participantCameraToggled', (data) => {
      if (data.targetUserId === currentUser?.id) {
        const room = (window as any).livekitRoom;
        if (room) {
          room.localParticipant.setCameraEnabled(data.enabled).catch(() => {});
        }
      }
      if (data.enabled) {
        dispatch(participantCameraEnabled(data.targetUserId));
      } else {
        dispatch(participantCameraDisabled(data.targetUserId));
      }
    });

    newSocket.on('participantScreenShareToggled', (data) => {
      if (data.targetUserId === currentUser?.id) {
        const room = (window as any).livekitRoom;
        if (room) {
          if (data.enabled) {
            room.localParticipant.setScreenShareEnabled(true).catch(() => {});
          } else {
            room.localParticipant.setScreenShareEnabled(false).catch(() => {});
          }
        }
      }
      if (data.enabled) {
        dispatch(participantScreenShareStarted(data.targetUserId));
      } else {
        dispatch(participantScreenShareStopped(data.targetUserId));
      }
    });

    newSocket.on('rolePermissionsChanged', (data) => {
      if (data.userId === currentUser?.id) {
        const room = (window as any).livekitRoom;
        if (room) {
          // Role permissions updated
        }
      }
    });

    newSocket.on('participantKicked', (data) => {
      if (data.userId === currentUser?.id) {
        const room = (window as any).livekitRoom;
        if (room) {
          room.disconnect();
        }
        alert('You have been removed from the meeting');
        window.location.href = '/meetings';
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentUser?.id, meetingId, dispatch]);

  const joinMeetingRoom = useCallback((callback?: (response: any) => void) => {
    if (meetingId) {
      socket?.emit('joinMeetingRoom', meetingId, callback);
    }
  }, [socket, meetingId]);

  const leaveMeetingRoom = useCallback(() => {
    if (meetingId) {
      socket?.emit('leaveMeetingRoom', meetingId);
    }
  }, [socket, meetingId]);

  const muteParticipant = useCallback((targetUserId: number) => {
    if (meetingId) {
      socket?.emit('muteParticipant', { meetingId, targetUserId });
    }
  }, [socket, meetingId]);

  const unmuteParticipant = useCallback((targetUserId: number) => {
    if (meetingId) {
      socket?.emit('unmuteParticipant', { meetingId, targetUserId });
    }
  }, [socket, meetingId]);

  const requestUnmute = useCallback(() => {
    if (meetingId) {
      socket?.emit('requestUnmute', { meetingId });
    }
  }, [socket, meetingId]);

  const toggleCamera = useCallback((targetUserId: number, enabled: boolean) => {
    if (meetingId) {
      socket?.emit('toggleCamera', { meetingId, targetUserId, enabled });
    }
  }, [socket, meetingId]);

  const toggleScreenShare = useCallback((targetUserId: number, enabled: boolean) => {
    if (meetingId) {
      socket?.emit('toggleScreenShare', { meetingId, targetUserId, enabled });
    }
  }, [socket, meetingId]);

  const kickParticipant = useCallback((targetUserId: number) => {
    if (meetingId) {
      socket?.emit('kickParticipant', { meetingId, targetUserId });
    }
  }, [socket, meetingId]);

  return {
    socket,
    isConnected,
    joinMeetingRoom,
    leaveMeetingRoom,
    muteParticipant,
    unmuteParticipant,
    requestUnmute,
    toggleCamera,
    toggleScreenShare,
    kickParticipant
  };
};