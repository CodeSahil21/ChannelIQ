import { TypedServer, ParticipantEventData, RoleChangeEventData, MeetingEventData } from '../sockets/types';

let socketServer: TypedServer | null = null;

export const setMeetingSocketServer = (io: TypedServer) => {
  socketServer = io;
};

export const emitParticipantJoined = async (data: ParticipantEventData) => {
  if (socketServer) {
    // Socket.io Redis adapter automatically handles cross-instance communication
    socketServer.to(`meeting:${data.meetingId}`).emit('participantJoined', data);
  }
};

export const emitParticipantLeft = async (data: ParticipantEventData) => {
  if (socketServer) {
    socketServer.to(`meeting:${data.meetingId}`).emit('participantLeft', data);
  }
};

export const emitParticipantRoleChanged = async (data: RoleChangeEventData) => {
  if (socketServer) {
    socketServer.to(`meeting:${data.meetingId}`).emit('participantRoleChanged', data);
  }
};

export const emitMeetingStarted = async (data: MeetingEventData) => {
  if (socketServer) {
    socketServer.to(`meeting:${data.meetingId}`).emit('meetingStarted', data);
  }
};

export const emitMeetingEnded = async (data: MeetingEventData) => {
  if (socketServer) {
    socketServer.to(`meeting:${data.meetingId}`).emit('meetingEnded', data);
  }
};