import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { joinMeeting } from '../../store/meetingSlice';
import type { Meeting } from '../../types/meeting.types';

interface MeetingJoinCardProps {
  meeting: Meeting | null;
  joinLoading: boolean;
  error: string | null;
  userRole: string | null;
}

const MeetingJoinCard: React.FC<MeetingJoinCardProps> = ({
  meeting,
  joinLoading,
  error,
  userRole
}) => {
  const dispatch = useAppDispatch();
  const [inviteToken, setInviteToken] = useState('');
  const [password, setPassword] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);

  React.useEffect(() => {
    if (error?.includes('Too many')) {
      setCooldownTime(900); // 15 minutes cooldown
      const timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [error]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meeting || !inviteToken.trim()) return;

    const joinData = {
      inviteToken: inviteToken.trim(),
      ...(meeting.passwordEnabled && password && { password })
    };

    dispatch(joinMeeting({
      meetingId: meeting.id,
      data: joinData
    }));
  };

  const formatCooldownTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isJoinDisabled = () => {
    return (
      !meeting ||
      !inviteToken.trim() ||
      joinLoading ||
      cooldownTime > 0 ||
      meeting.status === 'ENDED' ||
      meeting.status === 'CANCELLED' ||
      userRole !== null
    );
  };

  if (!meeting) {
    return null;
  }

  if (userRole) {
    return (
      <div className="meeting-join-card">
        <div className="meeting-join-card__success">
          <div className="meeting-join-card__success-icon">✅</div>
          <h3>Successfully Joined</h3>
          <p>You have joined as {userRole.toLowerCase()}</p>
        </div>
      </div>
    );
  }

  if (meeting.status === 'ENDED' || meeting.status === 'CANCELLED') {
    return (
      <div className="meeting-join-card">
        <div className="meeting-join-card__unavailable">
          <div className="meeting-join-card__unavailable-icon">⚠️</div>
          <h3>Meeting {meeting.status === 'ENDED' ? 'Ended' : 'Cancelled'}</h3>
          <p>This meeting is no longer available to join.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-join-card">
      <div className="meeting-join-card__header">
        <h3>Join Meeting</h3>
        <p>Enter your invite token to join the meeting</p>
      </div>

      <form onSubmit={handleJoin} className="meeting-join-card__form">
        <div className="form-group">
          <label htmlFor="inviteToken" className="form-label">
            Invite Token *
          </label>
          <input
            id="inviteToken"
            type="text"
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            placeholder="Enter invite token"
            className="form-input"
            disabled={joinLoading || cooldownTime > 0}
            required
          />
        </div>

        {meeting.passwordEnabled && (
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Meeting Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter meeting password"
              className="form-input"
              disabled={joinLoading || cooldownTime > 0}
            />
          </div>
        )}

        {error && (
          <div className="meeting-join-card__error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {cooldownTime > 0 && (
          <div className="meeting-join-card__cooldown">
            <span className="cooldown-icon">⏱️</span>
            <span>
              Too many attempts. Try again in {formatCooldownTime(cooldownTime)}
            </span>
          </div>
        )}

        <button
          type="submit"
          className="meeting-join-card__button"
          disabled={isJoinDisabled()}
        >
          {joinLoading ? (
            <>
              <span className="button-spinner"></span>
              Joining...
            </>
          ) : cooldownTime > 0 ? (
            `Wait ${formatCooldownTime(cooldownTime)}`
          ) : (
            'Join Meeting'
          )}
        </button>
      </form>
    </div>
  );
};

export default MeetingJoinCard;