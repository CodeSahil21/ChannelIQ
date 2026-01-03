import { TypedServer, TypedSocket } from './types';
import { prisma } from '../config/db';
import { emitParticipantMuted, emitParticipantUnmuted, emitCameraToggled, emitScreenShareToggled } from '../services/meetingSocket.service';

export const registerMeetingHandlers = (io: TypedServer, socket: TypedSocket) => {
  const joinMeetingRoom = async (meetingId: string) => {
    try {
      if (!socket.data.user?.id) return;

      // Verify user is a participant
      const participant = await prisma.meetingParticipant.findFirst({
        where: {
          meetingId,
          userId: socket.data.user.id,
          leftAt: null
        }
      });

      if (participant) {
        socket.join(`meeting:${meetingId}`);
        console.log(`User ${socket.data.user.id} joined meeting room ${meetingId}`);
        
        // Emit participant joined event to all other participants
        socket.to(`meeting:${meetingId}`).emit('participantJoined', {
          meetingId,
          userId: socket.data.user.id,
          userName: socket.data.user.email,
          userEmail: socket.data.user.email,
          role: participant.role,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error joining meeting room:', error);
    }
  };

  const leaveMeetingRoom = (meetingId: string) => {
    socket.leave(`meeting:${meetingId}`);
    console.log(`User ${socket.data.user?.id} left meeting room ${meetingId}`);
    
    // Emit participant left event to all other participants
    if (socket.data.user?.id) {
      socket.to(`meeting:${meetingId}`).emit('participantLeft', {
        meetingId,
        userId: socket.data.user.id,
        userName: socket.data.user.email,
        userEmail: socket.data.user.email,
        role: 'PARTICIPANT' as any,
        timestamp: new Date().toISOString()
      });
    }
  };

  const muteParticipant = async (data: { meetingId: string; targetUserId: number }) => {
    try {
      if (!socket.data.user?.id) return;

      console.log('Mute request received:', { from: socket.data.user.id, target: data.targetUserId, meetingId: data.meetingId });

      // Verify user has permission (HOST or CO_HOST)
      const participant = await prisma.meetingParticipant.findFirst({
        where: {
          meetingId: data.meetingId,
          userId: socket.data.user.id,
          role: { in: ['HOST', 'CO_HOST'] },
          leftAt: null
        }
      });

      if (participant) {
        console.log('Permission verified, emitting mute event');
        await emitParticipantMuted({
          meetingId: data.meetingId,
          targetUserId: data.targetUserId,
          mutedBy: socket.data.user.id,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('Permission denied for mute request');
      }
    } catch (error) {
      console.error('Error muting participant:', error);
    }
  };

  const unmuteParticipant = async (data: { meetingId: string; targetUserId: number }) => {
    try {
      if (!socket.data.user?.id) return;

      console.log('Unmute request received:', { from: socket.data.user.id, target: data.targetUserId, meetingId: data.meetingId });

      // Verify user has permission (HOST or CO_HOST)
      const participant = await prisma.meetingParticipant.findFirst({
        where: {
          meetingId: data.meetingId,
          userId: socket.data.user.id,
          role: { in: ['HOST', 'CO_HOST'] },
          leftAt: null
        }
      });

      if (participant) {
        console.log('Permission verified, emitting unmute event');
        await emitParticipantUnmuted({
          meetingId: data.meetingId,
          targetUserId: data.targetUserId,
          mutedBy: socket.data.user.id,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('Permission denied for unmute request');
      }
    } catch (error) {
      console.error('Error unmuting participant:', error);
    }
  };

  const requestUnmute = async (data: { meetingId: string }) => {
    try {
      if (!socket.data.user?.id) return;

      // Verify user is a participant
      const participant = await prisma.meetingParticipant.findFirst({
        where: {
          meetingId: data.meetingId,
          userId: socket.data.user.id,
          leftAt: null
        }
      });

      if (participant) {
        // Send request to hosts/co-hosts only
        io.to(`meeting:${data.meetingId}`).emit('unmuteRequested', {
          meetingId: data.meetingId,
          userId: socket.data.user.id,
          userName: socket.data.user.email,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error requesting unmute:', error);
    }
  };

  const toggleCamera = async (data: { meetingId: string; targetUserId: number; enabled: boolean }) => {
    try {
      if (!socket.data.user?.id) return;

      console.log('Camera toggle request received:', { from: socket.data.user.id, target: data.targetUserId, enabled: data.enabled, meetingId: data.meetingId });

      // Verify user has permission (HOST or CO_HOST)
      const participant = await prisma.meetingParticipant.findFirst({
        where: {
          meetingId: data.meetingId,
          userId: socket.data.user.id,
          role: { in: ['HOST', 'CO_HOST'] },
          leftAt: null
        }
      });

      if (participant) {
        console.log('Permission verified, emitting camera toggle event');
        await emitCameraToggled({
          meetingId: data.meetingId,
          targetUserId: data.targetUserId,
          enabled: data.enabled,
          controlledBy: socket.data.user.id,
          controlledByEmail: socket.data.user.email,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('Permission denied for camera toggle request');
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  const toggleScreenShare = async (data: { meetingId: string; targetUserId: number; enabled: boolean }) => {
    try {
      if (!socket.data.user?.id) return;

      console.log('Screen share toggle request received:', { from: socket.data.user.id, target: data.targetUserId, enabled: data.enabled, meetingId: data.meetingId });

      // Verify user has permission (HOST or CO_HOST)
      const participant = await prisma.meetingParticipant.findFirst({
        where: {
          meetingId: data.meetingId,
          userId: socket.data.user.id,
          role: { in: ['HOST', 'CO_HOST'] },
          leftAt: null
        }
      });

      if (participant) {
        console.log('Permission verified, emitting screen share toggle event');
        await emitScreenShareToggled({
          meetingId: data.meetingId,
          targetUserId: data.targetUserId,
          enabled: data.enabled,
          controlledBy: socket.data.user.id,
          controlledByEmail: socket.data.user.email,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('Permission denied for screen share toggle request');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const kickParticipant = async (data: { meetingId: string; targetUserId: number }) => {
    try {
      if (!socket.data.user?.id) return;

      console.log('Kick participant request received:', { from: socket.data.user.id, target: data.targetUserId, meetingId: data.meetingId });

      // Verify user has permission (HOST or CO_HOST)
      const participant = await prisma.meetingParticipant.findFirst({
        where: {
          meetingId: data.meetingId,
          userId: socket.data.user.id,
          role: { in: ['HOST', 'CO_HOST'] },
          leftAt: null
        }
      });

      if (participant) {
        console.log('Permission verified, kicking participant');
        // Remove participant from meeting
        await prisma.meetingParticipant.updateMany({
          where: {
            meetingId: data.meetingId,
            userId: data.targetUserId
          },
          data: { leftAt: new Date() }
        });

        // Send kick event to target user
        const targetSockets = await io.in(`meeting:${data.meetingId}`).fetchSockets();
        const targetSocket = targetSockets.find(s => s.data.user?.id === data.targetUserId);
        if (targetSocket) {
          console.log('Sending kick event to target user:', data.targetUserId);
          targetSocket.emit('participantKicked', {
            meetingId: data.meetingId,
            userId: data.targetUserId,
            kickedBy: socket.data.user.id
          });
        } else {
          console.log('Target socket not found for kick event');
        }

        // Broadcast participant left to all
        console.log('Broadcasting participant left event');
        io.to(`meeting:${data.meetingId}`).emit('participantLeft', {
          meetingId: data.meetingId,
          userId: data.targetUserId,
          role: 'PARTICIPANT' as any,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('Permission denied for kick request');
      }
    } catch (error) {
      console.error('Error kicking participant:', error);
    }
  };

  socket.on('joinMeetingRoom', joinMeetingRoom);
  socket.on('leaveMeetingRoom', leaveMeetingRoom);
  socket.on('muteParticipant', muteParticipant);
  socket.on('unmuteParticipant', unmuteParticipant);
  socket.on('requestUnmute', requestUnmute);
  socket.on('toggleCamera', toggleCamera);
  socket.on('toggleScreenShare', toggleScreenShare);
  socket.on('kickParticipant', kickParticipant);

  socket.on('disconnect', () => {
    console.log(`User ${socket.data.user?.id} disconnected from meeting socket`);
    
    // Emit participant left event to all meeting rooms this user was in
    if (socket.data.user?.id) {
      // Get all rooms this socket was in (meeting rooms start with 'meeting:')
      const rooms = Array.from(socket.rooms).filter(room => room.startsWith('meeting:'));
      rooms.forEach(room => {
        const meetingId = room.replace('meeting:', '');
        socket.to(room).emit('participantLeft', {
          meetingId,
          userId: socket.data.user!.id,
          userName: socket.data.user!.email,
          userEmail: socket.data.user!.email,
          role: 'PARTICIPANT' as any,
          timestamp: new Date().toISOString()
        });
      });
    }
  });
};