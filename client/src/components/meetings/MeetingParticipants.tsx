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
import styles from './MeetingParticipants.module.css';

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
  const mutedParticipants = useAppSelector(state => state.meeting.mutedParticipants);
  const cameraDisabledParticipants = useAppSelector(state => state.meeting.cameraDisabledParticipants);
  const screenSharingParticipants = useAppSelector(state => state.meeting.screenSharingParticipants);
  const currentUser = useAppSelector(state => state.user.user);
  const canManageRoles = userRole === 'HOST';
  const canMuteParticipants = userRole === 'HOST' || userRole === 'CO_HOST';

  // Initialize meeting socket for real-time updates
  const { isConnected, joinMeetingRoom, muteParticipant, unmuteParticipant, toggleCamera, toggleScreenShare, kickParticipant } = useMeetingSocket(meetingId);

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

  const handleMute = (userId: number) => {
    if (!canMuteParticipants) return;
    muteParticipant(userId);
  };

  const handleUnmute = (userId: number) => {
    if (!canMuteParticipants) return;
    unmuteParticipant(userId);
  };

  const handleToggleCamera = (userId: number, enabled: boolean) => {
    if (!canMuteParticipants) return;
    toggleCamera(userId, enabled);
  };

  const handleToggleScreenShare = (userId: number, enabled: boolean) => {
    if (!canMuteParticipants) return;
    toggleScreenShare(userId, enabled);
  };

  const handleKickParticipant = (userId: number) => {
    if (!canManageRoles) return;
    if (confirm('Are you sure you want to remove this participant from the meeting?')) {
      kickParticipant(userId);
    }
  };

  const getRoleBadge = (role: ParticipantRole) => {
    const roleConfig = {
      HOST: { class: 'participant-role--host', text: 'Host' },
      CO_HOST: { class: 'participant-role--cohost', text: 'Co-Host' },
      PARTICIPANT: { class: 'participant-role--participant', text: 'Participant' }
    };

    const config = roleConfig[role];
    return (
      <span className={`${styles['participant-role']} ${styles[config.class]}`}>
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

  // Debug logging removed

  if (!meetingId) {
    return null;
  }

  return (
    <div className={styles['meeting-participants']}>
      <div className={styles['meeting-participants__header']}>
        <h3>Participants ({participants.length})</h3>
        {canManageRoles && (
          <span className={styles['meeting-participants__manage-hint']}>
            Click actions to manage roles
          </span>
        )}
      </div>

      {error && (
        <div className={styles['meeting-participants__error']}>
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className={styles['meeting-participants__list']}>
        {participants.length === 0 ? (
          <div className={styles['meeting-participants__empty']}>
            <div className={styles['meeting-participants__empty-icon']}>👥</div>
            <p>No participants yet</p>
            <span>Participants will appear here when they join</span>
          </div>
        ) : (
          participants.map((participant) => (
            <div key={participant.id} className={styles['participant-card']}>
              <div className={styles['participant-card__content']}>
                <div className={styles['participant-card__avatar']}>
                  {participant.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                
                <div className={styles['participant-card__info']}>
                  <div className={styles['participant-card__name']}>
                    {participant.userEmail || `User ${participant.userId}`}
                    <div className={styles['participant-card__status']}>
                      {mutedParticipants.includes(participant.userId) && <span className={`${styles['status-icon']} ${styles.muted}`} title="Muted">🔇</span>}
                      {cameraDisabledParticipants.includes(participant.userId) && <span className={`${styles['status-icon']} ${styles['camera-off']}`} title="Camera Off">📹</span>}
                      {screenSharingParticipants.includes(participant.userId) && <span className={`${styles['status-icon']} ${styles['screen-share']}`} title="Screen Sharing">🖥️</span>}
                    </div>
                  </div>
                  <div className={styles['participant-card__email']}>
                    {participant.userName || 'No name'}
                  </div>
                  <div className={styles['participant-card__meta']}>
                    <span className={styles['participant-card__join-time']}>
                      Joined {formatJoinTime(participant.joinedAt)}
                    </span>
                    {getRoleBadge(participant.role)}
                  </div>
                </div>
                
                <div className={styles['participant-card__actions']}>
                  {canMuteParticipants && participant.userId !== currentUser?.id && (
                    <>
                      <button
                        onClick={() => mutedParticipants.includes(participant.userId) ? handleUnmute(participant.userId) : handleMute(participant.userId)}
                        className={`${styles['action-btn']} ${styles[mutedParticipants.includes(participant.userId) ? 'action-btn--unmute' : 'action-btn--mute']}`}
                        title={mutedParticipants.includes(participant.userId) ? 'Unmute' : 'Mute'}
                      >
                        {mutedParticipants.includes(participant.userId) ? '🔊' : '🔇'}
                      </button>
                      
                      <button
                        onClick={() => handleToggleCamera(participant.userId, !cameraDisabledParticipants.includes(participant.userId))}
                        className={`${styles['action-btn']} ${styles[cameraDisabledParticipants.includes(participant.userId) ? 'action-btn--camera-on' : 'action-btn--camera-off']}`}
                        title={cameraDisabledParticipants.includes(participant.userId) ? 'Enable Camera' : 'Disable Camera'}
                      >
                        {cameraDisabledParticipants.includes(participant.userId) ? '📷' : '📹'}
                      </button>
                      
                      <button
                        onClick={() => handleToggleScreenShare(participant.userId, !screenSharingParticipants.includes(participant.userId))}
                        className={`${styles['action-btn']} ${styles[screenSharingParticipants.includes(participant.userId) ? 'action-btn--screen-stop' : 'action-btn--screen-share']}`}
                        title={screenSharingParticipants.includes(participant.userId) ? 'Stop Screen Share' : 'Request Screen Share'}
                      >
                        🖥️
                      </button>
                    </>
                  )}
                  
                  {canManageRoles && participant.role !== 'HOST' && (
                    <>
                      <button
                        onClick={() => participant.role === 'PARTICIPANT' ? handlePromote(participant.userId) : handleDemote(participant.userId)}
                        className={`${styles['action-btn']} ${styles[participant.role === 'PARTICIPANT' ? 'action-btn--promote' : 'action-btn--demote']}`}
                        title={participant.role === 'PARTICIPANT' ? 'Promote to Co-Host' : 'Demote to Participant'}
                      >
                        {participant.role === 'PARTICIPANT' ? '⬆️' : '⬇️'}
                      </button>
                      
                      <button
                        onClick={() => handleKickParticipant(participant.userId)}
                        className={`${styles['action-btn']} ${styles['action-btn--kick']}`}
                        title="Remove from Meeting"
                      >
                        🚫
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {canManageRoles && participants.length > 0 && (
        <div className={styles['meeting-participants__legend']}>
          <div className={styles['legend-item']}>
            <span className={styles['legend-icon']}>⬆️</span>
            <span>Promote to Co-Host</span>
          </div>
          <div className={styles['legend-item']}>
            <span className={styles['legend-icon']}>⬇️</span>
            <span>Demote to Participant</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingParticipants;