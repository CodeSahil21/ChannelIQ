import React, { useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useMeetingSocket } from '../../hooks/useMeetingSocket';
import {
  fetchMeeting,
  promoteCoHost,
  demoteCoHost,
  socketParticipantJoined
} from '../../store/meetingSlice';
import type { ParticipantRole } from '../../types/meeting.types';

interface MeetingParticipantsProps {
  meetingId: string | null;
  userRole: ParticipantRole | null;
  error: string | null;
}

const MeetingParticipants: React.FC<MeetingParticipantsProps> = ({
  meetingId,
  userRole,
  error
}) => {
  const dispatch = useAppDispatch();
  const participants = useAppSelector(state => state.meeting.participants);
  const currentUser = useAppSelector(state => state.user.user);
  const canManageRoles = userRole === 'HOST';

  // Initialize meeting socket for real-time updates
  const { isConnected, joinMeetingRoom } = useMeetingSocket(meetingId);

  useEffect(() => {
    if (meetingId) {
      dispatch(fetchMeeting(meetingId));
      // Join meeting room when component mounts
      joinMeetingRoom();
    }
  }, [dispatch, meetingId, joinMeetingRoom]);

  // Remove the manual participant addition since API fetch now handles it

  const handlePromote = (userId: number) => {
    if (!meetingId || !canManageRoles) return;
    dispatch(promoteCoHost({
      meetingId,
      data: { userId }
    }));
  };

  const handleDemote = (userId: number) => {
    if (!meetingId || !canManageRoles) return;
    dispatch(demoteCoHost({
      meetingId,
      data: { userId }
    }));
  };

  const getRoleBadge = (role: ParticipantRole) => {
    const roleConfig = {
      HOST: { class: 'participant-role--host', text: 'Host' },
      CO_HOST: { class: 'participant-role--cohost', text: 'Co-Host' },
      PARTICIPANT: { class: 'participant-role--participant', text: 'Participant' }
    };

    const config = roleConfig[role];
    return (
      <span className={`participant-role ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const formatJoinTime = (joinedAt: string) => {
    const date = new Date(joinedAt);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  console.log('MeetingParticipants render - participants:', participants.length, participants);

  if (!meetingId) {
    return null;
  }

  return (
    <div className="meeting-participants">
      <div className="meeting-participants__header">
        <h3>Participants ({participants.length})</h3>
        {canManageRoles && (
          <span className="meeting-participants__manage-hint">
            Click actions to manage roles
          </span>
        )}
      </div>

      {error && (
        <div className="meeting-participants__error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="meeting-participants__list">
        {participants.length === 0 ? (
          <div className="meeting-participants__empty">
            <div className="meeting-participants__empty-icon">👥</div>
            <p>No participants yet</p>
            <span>Participants will appear here when they join</span>
          </div>
        ) : (
          participants.map((participant) => (
            <div key={participant.id} className="participant-item">
              <div className="participant-item__info">
                <div className="participant-item__avatar">
                  {participant.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="participant-item__details">
                  <div className="participant-item__name">
                    {participant.userName || `User ${participant.userId}`}
                  </div>
                  <div className="participant-item__email">
                    {participant.userEmail || 'No email'}
                  </div>
                  <div className="participant-item__join-time">
                    Joined at {formatJoinTime(participant.joinedAt)}
                  </div>
                </div>
              </div>

              <div className="participant-item__role-section">
                {getRoleBadge(participant.role)}
                
                {canManageRoles && participant.role !== 'HOST' && (
                  <div className="participant-item__actions">
                    {participant.role === 'PARTICIPANT' ? (
                      <button
                        onClick={() => handlePromote(participant.userId)}
                        className="participant-action participant-action--promote"
                        title="Promote to Co-Host"
                      >
                        ⬆️
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDemote(participant.userId)}
                        className="participant-action participant-action--demote"
                        title="Demote to Participant"
                      >
                        ⬇️
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {canManageRoles && participants.length > 0 && (
        <div className="meeting-participants__legend">
          <div className="legend-item">
            <span className="legend-icon">⬆️</span>
            <span>Promote to Co-Host</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">⬇️</span>
            <span>Demote to Participant</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingParticipants;