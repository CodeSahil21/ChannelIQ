import { TypedServer, TypedSocket } from './types';
import { prisma } from '../config/db';

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
      }
    } catch (error) {
      console.error('Error joining meeting room:', error);
    }
  };

  const leaveMeetingRoom = (meetingId: string) => {
    socket.leave(`meeting:${meetingId}`);
    console.log(`User ${socket.data.user?.id} left meeting room ${meetingId}`);
  };

  const muteParticipant = async (data: { meetingId: string; targetUserId: number }) => {
    try {
      if (!socket.data.user?.id) return;

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
        io.to(`meeting:${data.meetingId}`).emit('participantMuted', {
          meetingId: data.meetingId,
          targetUserId: data.targetUserId,
          mutedBy: socket.data.user.id,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error muting participant:', error);
    }
  };

  const unmuteParticipant = async (data: { meetingId: string; targetUserId: number }) => {
    try {
      if (!socket.data.user?.id) return;

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
        io.to(`meeting:${data.meetingId}`).emit('participantUnmuted', {
          meetingId: data.meetingId,
          targetUserId: data.targetUserId,
          mutedBy: socket.data.user.id,
          timestamp: new Date().toISOString()
        });
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
          userName: `User ${socket.data.user.id}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error requesting unmute:', error);
    }
  };

  socket.on('joinMeetingRoom', joinMeetingRoom);
  socket.on('leaveMeetingRoom', leaveMeetingRoom);
  socket.on('muteParticipant', muteParticipant);
  socket.on('unmuteParticipant', unmuteParticipant);
  socket.on('requestUnmute', requestUnmute);

  socket.on('disconnect', () => {
    console.log(`User ${socket.data.user?.id} disconnected from meeting socket`);
  });
};