import { TypedServer, ParticipantEventData, RoleChangeEventData, MeetingEventData, MediaEventData, MuteEventData } from '../sockets/types';

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
    // Broadcast role change to all participants
    socketServer.to(`meeting:${data.meetingId}`).emit('participantRoleChanged', data);
    
    // Send permission update to the specific user whose role changed
    const targetSockets = await socketServer.in(`meeting:${data.meetingId}`).fetchSockets();
    const targetSocket = targetSockets.find(s => s.data.user?.id === data.userId);
    if (targetSocket) {
      targetSocket.emit('rolePermissionsChanged', {
        userId: data.userId,
        newRole: data.newRole,
        canControlMedia: data.newRole === 'HOST' || data.newRole === 'CO_HOST'
      });
    }
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



export const emitParticipantUnmuted = async (data: MuteEventData) => {
  if (socketServer) {
    console.log('Emitting participantUnmuted event:', data);
    const targetSockets = await socketServer.in(`meeting:${data.meetingId}`).fetchSockets();
    console.log('Found sockets in meeting room:', targetSockets.length);
    const targetSocket = targetSockets.find(s => s.data.user?.id === data.targetUserId);
    if (targetSocket) {
      console.log('Sending unmute event to target user:', data.targetUserId);
      targetSocket.emit('participantUnmuted', data);
    } else {
      console.log('Target socket not found for user:', data.targetUserId);
    }
  }
};

export const emitParticipantMuted = async (data: MuteEventData) => {
  if (socketServer) {
    console.log('Emitting participantMuted event:', data);
    const targetSockets = await socketServer.in(`meeting:${data.meetingId}`).fetchSockets();
    const targetSocket = targetSockets.find(s => s.data.user?.id === data.targetUserId);
    if (targetSocket) {
      console.log('Sending mute event to target user:', data.targetUserId);
      targetSocket.emit('participantMuted', data);
    } else {
      console.log('Target socket not found for user:', data.targetUserId);
    }
  }
};

export const emitCameraToggled = async (data: MediaEventData) => {
  if (socketServer) {
    console.log('Emitting participantCameraToggled event:', data);
    const targetSockets = await socketServer.in(`meeting:${data.meetingId}`).fetchSockets();
    const targetSocket = targetSockets.find(s => s.data.user?.id === data.targetUserId);
    if (targetSocket) {
      console.log('Sending camera toggle event to target user:', data.targetUserId);
      targetSocket.emit('participantCameraToggled', data);
    } else {
      console.log('Target socket not found for camera toggle:', data.targetUserId);
    }
  }
};

export const emitScreenShareToggled = async (data: MediaEventData) => {
  if (socketServer) {
    console.log('Emitting participantScreenShareToggled event:', data);
    const targetSockets = await socketServer.in(`meeting:${data.meetingId}`).fetchSockets();
    const targetSocket = targetSockets.find(s => s.data.user?.id === data.targetUserId);
    if (targetSocket) {
      console.log('Sending screen share toggle event to target user:', data.targetUserId);
      targetSocket.emit('participantScreenShareToggled', data);
    } else {
      console.log('Target socket not found for screen share toggle:', data.targetUserId);
    }
  }
};