import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import CreateMeetingModal from '../components/meetings/CreateMeetingModal';
import JoinMeetingModal from '../components/meetings/JoinMeetingModal';

const MeetingDemo: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleCreateMeeting = () => {
    setShowCreateModal(true);
  };

  const handleMeetingCreated = (meetingId: string) => {
    navigate(`/meeting/${meetingId}`);
  };

  const handleJoinExistingMeeting = () => {
    setShowJoinModal(true);
  };

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-welcome-card">
          <div className="welcome-header">
            <h1 className="welcome-title">Meeting System</h1>
            <p className="welcome-subtitle">
              Create or join meetings for seamless video collaboration
            </p>
          </div>
        </div>

        <div className="dashboard-features">
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🎥</div>
            </div>
            <h3>Create New Meeting</h3>
            <p>Start a new meeting and invite participants</p>
            <button 
              onClick={handleCreateMeeting}
              className="demo-button demo-button--primary"
            >
              Create Meeting
            </button>
          </div>

          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🔗</div>
            </div>
            <h3>Join Existing Meeting</h3>
            <p>Enter a meeting ID to join an ongoing meeting</p>
            <button 
              onClick={handleJoinExistingMeeting}
              className="demo-button demo-button--secondary"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
      
      <CreateMeetingModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleMeetingCreated}
      />
      
      <JoinMeetingModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </Layout>
  );
};

export default MeetingDemo;