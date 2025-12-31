import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateMeetingModal from '../components/meetings/CreateMeetingModal';

const MeetingDemo: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateMeeting = () => {
    setShowCreateModal(true);
  };

  const handleMeetingCreated = (meetingId: string) => {
    navigate(`/meeting/${meetingId}`);
  };

  const handleJoinExistingMeeting = () => {
    const meetingId = prompt('Enter Meeting ID:');
    if (meetingId) {
      navigate(`/meeting/${meetingId}`);
    }
  };

  return (
    <div className="meeting-demo">
      <div className="meeting-demo__container">
        <div className="meeting-demo__header">
          <h1>Meeting System Demo</h1>
          <p>
            This demo showcases the CorporateChat meeting functionality built with LiveKit.
            You can create new meetings or join existing ones using meeting IDs.
          </p>
        </div>

        <div className="meeting-demo__actions">
          <div className="demo-card">
            <div className="demo-card__icon">🎥</div>
            <h3>Create New Meeting</h3>
            <p>Start a new meeting and invite participants</p>
            <button 
              onClick={handleCreateMeeting}
              className="demo-button demo-button--primary"
            >
              Create Meeting
            </button>
          </div>

          <div className="demo-card">
            <div className="demo-card__icon">🔗</div>
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

        <div className="meeting-demo__features">
          <h2>Meeting Features</h2>
          <div className="features-grid">
            <div className="feature-item">
              <h4>🔒 Role-Based Access</h4>
              <p>HOST, CO_HOST, and PARTICIPANT roles with different permissions</p>
            </div>
            <div className="feature-item">
              <h4>🎬 LiveKit Integration</h4>
              <p>High-quality video/audio powered by LiveKit Cloud</p>
            </div>
            <div className="feature-item">
              <h4>🔐 Secure Authentication</h4>
              <p>JWT-based authentication with HTTP-only cookies</p>
            </div>
            <div className="feature-item">
              <h4>📱 Responsive Design</h4>
              <p>Works seamlessly on desktop and mobile devices</p>
            </div>
          </div>
        </div>

        <div className="meeting-demo__instructions">
          <h2>How to Use</h2>
          <ol>
            <li><strong>Create a Meeting:</strong> Click "Create Meeting" to start a new meeting room</li>
            <li><strong>Share Meeting ID:</strong> Share the meeting ID with participants</li>
            <li><strong>Join Meeting:</strong> Participants can join using the meeting ID and invite token</li>
            <li><strong>Manage Participants:</strong> Hosts can promote/demote participants and manage meeting settings</li>
            <li><strong>Video Conference:</strong> Enjoy high-quality video/audio communication</li>
          </ol>
        </div>
      </div>
      
      <CreateMeetingModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleMeetingCreated}
      />
    </div>
  );
};

export default MeetingDemo;