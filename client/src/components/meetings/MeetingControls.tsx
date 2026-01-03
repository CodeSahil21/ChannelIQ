import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppDispatch';
import {
  startMeeting,
  endMeeting,
  setPassword as setMeetingPassword,
  removePassword
} from '../../store/meetingSlice';
import type { Meeting, ParticipantRole } from '../../types/meeting.types';

interface MeetingControlsProps {
  meeting: Meeting | null;
  userRole: ParticipantRole | null;
  error: string | null;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({
  meeting,
  userRole,
  error
}) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.user.user);
  const participants = useAppSelector(state => state.meeting.participants);
  const mutedParticipants = useAppSelector(state => state.meeting.mutedParticipants);
  const cameraDisabledParticipants = useAppSelector(state => state.meeting.cameraDisabledParticipants);
  const screenSharingParticipants = useAppSelector(state => state.meeting.screenSharingParticipants);
  
  // Get current user's role from Redux state instead of props
  const currentUserParticipant = participants.find(p => p.userId === currentUser?.id);
  const currentUserRole = currentUserParticipant?.role || userRole;
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const canStartMeeting = currentUserRole === 'HOST' || currentUserRole === 'CO_HOST';
  const canEndMeeting = currentUserRole === 'HOST';
  const canManagePassword = currentUserRole === 'HOST';
  
  // Current user's media status
  const isCurrentUserMuted = currentUser ? mutedParticipants.includes(currentUser.id) : false;
  const isCurrentUserCameraDisabled = currentUser ? cameraDisabledParticipants.includes(currentUser.id) : false;
  const isCurrentUserScreenSharing = currentUser ? screenSharingParticipants.includes(currentUser.id) : false;

  const handleStartMeeting = () => {
    if (!meeting || !canStartMeeting) return;
    dispatch(startMeeting(meeting.id));
  };

  const handleEndMeeting = () => {
    if (!meeting || !canEndMeeting) return;
    dispatch(endMeeting(meeting.id));
    setShowEndConfirm(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting || !password.trim()) return;

    setPasswordLoading(true);
    try {
      await dispatch(setMeetingPassword({
        meetingId: meeting.id,
        data: { password: password.trim() }
      })).unwrap();
      setPassword('');
      setShowPasswordModal(false);
    } catch (error) {
      // Error handled by Redux
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRemovePassword = () => {
    if (!meeting) return;
    dispatch(removePassword(meeting.id));
  };

  if (!meeting || !currentUserRole) {
    return null;
  }

  return (
    <div className="meeting-controls">
      <div className="meeting-controls__header">
        <h3>Meeting Controls</h3>
        <span className="meeting-controls__role">
          Role: {currentUserRole?.replace('_', ' ')}
        </span>
      </div>

      <div className="meeting-controls__actions">
        {/* Start Meeting */}
        {canStartMeeting && meeting.status === 'SCHEDULED' && (
          <button
            onClick={handleStartMeeting}
            className="meeting-controls__button meeting-controls__button--start"
          >
            <span className="button-icon">▶️</span>
            Start Meeting
          </button>
        )}

        {/* End Meeting */}
        {canEndMeeting && meeting.status === 'LIVE' && (
          <button
            onClick={() => setShowEndConfirm(true)}
            className="meeting-controls__button meeting-controls__button--end"
          >
            <span className="button-icon">⏹️</span>
            End Meeting
          </button>
        )}

        {/* Password Management */}
        {canManagePassword && (
          <div className="meeting-controls__password">
            {meeting.passwordEnabled ? (
              <button
                onClick={handleRemovePassword}
                className="meeting-controls__button meeting-controls__button--secondary"
              >
                <span className="button-icon">🔓</span>
                Remove Password
              </button>
            ) : (
              <button
                onClick={() => setShowPasswordModal(true)}
                className="meeting-controls__button meeting-controls__button--secondary"
              >
                <span className="button-icon">🔒</span>
                Set Password
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="meeting-controls__error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h4>Set Meeting Password</h4>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="modal__close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSetPassword} className="modal__form">
              <div className="form-group">
                <label htmlFor="meetingPassword" className="form-label">
                  Password
                </label>
                <input
                  id="meetingPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter meeting password"
                  className="form-input"
                  disabled={passwordLoading}
                  required
                />
              </div>
              <div className="modal__actions">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="button button--secondary"
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={passwordLoading || !password.trim()}
                >
                  {passwordLoading ? 'Setting...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Meeting Confirmation */}
      {showEndConfirm && (
        <div className="modal-overlay" onClick={() => setShowEndConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h4>End Meeting</h4>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="modal__close"
              >
                ×
              </button>
            </div>
            <div className="modal__content">
              <p>Are you sure you want to end this meeting? This action cannot be undone.</p>
            </div>
            <div className="modal__actions">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="button button--secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEndMeeting}
                className="button button--danger"
              >
                End Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingControls;