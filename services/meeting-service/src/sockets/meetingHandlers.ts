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

  socket.on('joinMeetingRoom', joinMeetingRoom);
  socket.on('leaveMeetingRoom', leaveMeetingRoom);

  socket.on('disconnect', () => {
    console.log(`User ${socket.data.user?.id} disconnected from meeting socket`);
  });
};