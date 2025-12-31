import React, { useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { searchMeeting, clearError, resetMeetingState } from '../store/meetingSlice';
import MeetingHero from '../components/meetings/MeetingHero';
import MeetingJoinCard from '../components/meetings/MeetingJoinCard';
import MeetingControls from '../components/meetings/MeetingControls';
import MeetingParticipants from '../components/meetings/MeetingParticipants';

// Lazy load LiveKitRoom for performance
const LiveKitRoom = React.lazy(() => import('../components/meetings/LiveKitRoom'));

const Meeting: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  
  const {
    currentMeeting,
    participants,
    userRole,
    loading,
    error,
    joinLoading,
    liveKitReady
  } = useAppSelector(state => state.meeting);

  useEffect(() => {
    // Clear any previous state when component mounts
    dispatch(resetMeetingState());
    
    if (meetingId) {
      dispatch(searchMeeting(meetingId));
    }

    // Clear errors on unmount
    return () => {
      dispatch(clearError());
    };
  }, [dispatch, meetingId]);

  useEffect(() => {
    // Auto-populate invite token from URL params
    const inviteToken = searchParams.get('token');
    if (inviteToken && currentMeeting && !userRole) {
      // Could auto-join here if desired, but keeping manual for security
    }
  }, [searchParams, currentMeeting, userRole]);

  if (!meetingId) {
    return (
      <div className="meeting-page">
        <div className="meeting-page__error">
          <h1>Invalid Meeting URL</h1>
          <p>Please check your meeting link and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-page">
      <div className="meeting-page__container">
        {/* Meeting Hero Section */}
        <section className="meeting-section meeting-section--hero">
          <MeetingHero meeting={currentMeeting} loading={loading} />
        </section>

        {/* Main Content Grid */}
        <div className="meeting-page__grid">
          {/* Left Column - Join & Controls */}
          <div className="meeting-page__sidebar">
            {/* Join Card */}
            <section className="meeting-section meeting-section--join">
              <MeetingJoinCard
                meeting={currentMeeting}
                joinLoading={joinLoading}
                error={error}
                userRole={userRole}
              />
            </section>

            {/* Meeting Controls */}
            {userRole && (
              <section className="meeting-section meeting-section--controls">
                <MeetingControls
                  meeting={currentMeeting}
                  userRole={userRole}
                  error={error}
                />
              </section>
            )}

            {/* Participants List */}
            {userRole && (
              <section className="meeting-section meeting-section--participants">
                <MeetingParticipants
                  meetingId={currentMeeting?.id || null}
                  userRole={userRole}
                  error={error}
                />
              </section>
            )}
          </div>

          {/* Right Column - Video Conference */}
          <div className="meeting-page__main">
            {userRole && (
              <section className="meeting-section meeting-section--video">
                <Suspense
                  fallback={
                    <div className="meeting-video-loading">
                      <div className="spinner"></div>
                      <p>Loading video conference...</p>
                    </div>
                  }
                >
                  <LiveKitRoom
                    meeting={currentMeeting}
                    userRole={userRole}
                  />
                </Suspense>
              </section>
            )}
          </div>
        </div>

        {/* Connection Status Bar */}
        {userRole && currentMeeting?.status === 'LIVE' && (
          <div className="meeting-page__status-bar">
            <div className="status-bar__item">
              <span className="status-bar__label">Meeting Status:</span>
              <span className="status-bar__value status-bar__value--live">
                🔴 Live
              </span>
            </div>
            <div className="status-bar__item">
              <span className="status-bar__label">Participants:</span>
              <span className="status-bar__value">
                {participants.length}
              </span>
            </div>
            <div className="status-bar__item">
              <span className="status-bar__label">Video Connection:</span>
              <span className={`status-bar__value ${liveKitReady ? 'status-bar__value--connected' : 'status-bar__value--connecting'}`}>
                {liveKitReady ? '🟢 Connected' : '🟡 Connecting'}
              </span>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && !joinLoading && (
          <div className="meeting-page__error-banner">
            <div className="error-banner">
              <span className="error-banner__icon">⚠️</span>
              <span className="error-banner__message">{error}</span>
              <button
                onClick={() => dispatch(clearError())}
                className="error-banner__close"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meeting;