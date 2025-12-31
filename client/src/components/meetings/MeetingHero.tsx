import React from 'react';
import type { Meeting, MeetingStatus } from '../../types/meeting.types';

interface MeetingHeroProps {
  meeting: Meeting | null;
  loading: boolean;
}

const MeetingHero: React.FC<MeetingHeroProps> = ({ meeting, loading }) => {
  const getStatusBadge = (status: MeetingStatus) => {
    const statusConfig = {
      SCHEDULED: { class: 'meeting-status--scheduled', text: 'Scheduled' },
      LIVE: { class: 'meeting-status--live', text: 'Live' },
      ENDED: { class: 'meeting-status--ended', text: 'Ended' },
      CANCELLED: { class: 'meeting-status--cancelled', text: 'Cancelled' }
    };

    const config = statusConfig[status];
    return (
      <span className={`meeting-status ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="meeting-hero">
        <div className="meeting-hero__skeleton">
          <div className="skeleton skeleton--title"></div>
          <div className="skeleton skeleton--status"></div>
          <div className="skeleton skeleton--time"></div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="meeting-hero">
        <div className="meeting-hero__empty">
          <h1>Meeting Not Found</h1>
          <p>The meeting you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-hero">
      <div className="meeting-hero__content">
        <div className="meeting-hero__header">
          <h1 className="meeting-hero__title">{meeting.title}</h1>
          {getStatusBadge(meeting.status)}
        </div>
        
        {meeting.description && (
          <p className="meeting-hero__description">{meeting.description}</p>
        )}
        
        <div className="meeting-hero__details">
          <div className="meeting-hero__time">
            <span className="meeting-hero__time-label">Scheduled for:</span>
            <span className="meeting-hero__time-value">
              {formatDateTime(meeting.scheduledAt)}
            </span>
          </div>
          
          {meeting.passwordEnabled && (
            <div className="meeting-hero__security">
              <span className="meeting-hero__security-icon">🔒</span>
              <span>Password Protected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingHero;