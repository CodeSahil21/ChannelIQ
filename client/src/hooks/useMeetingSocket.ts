import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './useAppDispatch';
import { updateParticipant, removeParticipant, updateMeetingStatus, socketParticipantJoined, socketParticipantLeft, socketParticipantRoleChanged, socketMeetingStatusChanged } from '../store/meetingSlice';
import type { ParticipantRole } from '../types/meeting.types';
import type { RootState } from '../store';

export const useMeetingSocket = (meetingId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentUser = useSelector((state: RootState) => state.user.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!currentUser?.id || !meetingId) {
      console.log('❌ Missing requirements:', { currentUser: !!currentUser?.id, meetingId });
      return;
    }

    console.log('🔌 Attempting to connect to meeting socket via API gateway...');
    const newSocket = io('http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      path: '/meeting-socket/',
      forceNew: true // Force new connection to avoid cache
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to meeting socket');
    });

    newSocket.on('connect_error', (error) => {
      setIsConnected(false);
      console.error('Meeting socket connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Disconnected from meeting socket:', reason);
    });

    newSocket.on('participantJoined', (data) => {
      console.log('🟢 Participant joined:', data);
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
      console.log('🔴 Participant left:', data);
      dispatch(socketParticipantLeft(data.userId));
    });

    newSocket.on('participantRoleChanged', (data) => {
      console.log('🔄 Participant role changed:', data);
      dispatch(socketParticipantRoleChanged({
        userId: data.userId,
        newRole: data.newRole as ParticipantRole
      }));
    });

    newSocket.on('meetingStarted', (data) => {
      console.log('🟢 Meeting started:', data);
      dispatch(socketMeetingStatusChanged('LIVE'));
    });

    newSocket.on('meetingEnded', (data) => {
      console.log('🔴 Meeting ended:', data);
      dispatch(socketMeetingStatusChanged('ENDED'));
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

  return {
    socket,
    isConnected,
    joinMeetingRoom,
    leaveMeetingRoom
  };
};