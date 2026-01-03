import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import CreateMeetingModal from '../components/meetings/CreateMeetingModal';
import JoinMeetingModal from '../components/meetings/JoinMeetingModal';
import { HiVideoCamera, HiUserGroup, HiClock, HiShieldCheck, HiLightningBolt, HiGlobe } from 'react-icons/hi';

const MeetingDemo: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

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
      <div className="meeting-demo-container">
        {/* Hero Section */}
        <div className="meeting-hero-section">
          <div className="meeting-hero-content">
            <div className="meeting-hero-badge">
              <HiVideoCamera className="hero-badge-icon" />
              <span>ChannelIQ Meetings</span>
            </div>
            <h1 className="meeting-hero-title">
              Connect, Collaborate, Create
            </h1>
            <p className="meeting-hero-subtitle">
              Experience seamless video collaboration with enterprise-grade security and crystal-clear quality
            </p>
            <div className="meeting-hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">99.9%</span>
                <span className="hero-stat-label">Uptime</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">HD</span>
                <span className="hero-stat-label">Quality</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">500+</span>
                <span className="hero-stat-label">Participants</span>
              </div>
            </div>
          </div>
          <div className="meeting-hero-visual">
            <div className="hero-video-grid">
              <div className="hero-video-tile hero-video-tile--main">
                <div className="video-avatar">👨‍💼</div>
                <span className="video-name">You</span>
              </div>
              <div className="hero-video-tile">
                <div className="video-avatar">👩‍💻</div>
                <span className="video-name">Sarah</span>
              </div>
              <div className="hero-video-tile">
                <div className="video-avatar">👨‍🔬</div>
                <span className="video-name">Mike</span>
              </div>
              <div className="hero-video-tile">
                <div className="video-avatar">👩‍🎨</div>
                <span className="video-name">Lisa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="meeting-action-section">
          <div className="meeting-tabs">
            <button 
              className={`meeting-tab ${activeTab === 'create' ? 'meeting-tab--active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              <HiVideoCamera className="tab-icon" />
              Create Meeting
            </button>
            <button 
              className={`meeting-tab ${activeTab === 'join' ? 'meeting-tab--active' : ''}`}
              onClick={() => setActiveTab('join')}
            >
              <HiUserGroup className="tab-icon" />
              Join Meeting
            </button>
          </div>

          <div className="meeting-tab-content">
            {activeTab === 'create' && (
              <div className="meeting-workflow">
                <div className="workflow-header">
                  <h2>Start Your Meeting</h2>
                  <p>Create a new meeting room and invite your team</p>
                </div>
                
                <div className="workflow-steps">
                  <div className="workflow-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h3>Set Meeting Details</h3>
                      <p>Add title, description, and schedule</p>
                    </div>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h3>Configure Settings</h3>
                      <p>Set password, waiting room, and permissions</p>
                    </div>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h3>Share & Start</h3>
                      <p>Copy link and begin your meeting</p>
                    </div>
                  </div>
                </div>

                <div className="workflow-action">
                  <button 
                    onClick={handleCreateMeeting}
                    className="meeting-cta-button meeting-cta-button--primary"
                  >
                    <HiVideoCamera className="cta-icon" />
                    Create New Meeting
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'join' && (
              <div className="meeting-workflow">
                <div className="workflow-header">
                  <h2>Join a Meeting</h2>
                  <p>Enter meeting details to join an ongoing session</p>
                </div>
                
                <div className="workflow-steps">
                  <div className="workflow-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h3>Enter Meeting ID</h3>
                      <p>Paste the meeting link or enter the ID</p>
                    </div>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h3>Verify Access</h3>
                      <p>Enter password if required</p>
                    </div>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h3>Join & Collaborate</h3>
                      <p>Connect with your team instantly</p>
                    </div>
                  </div>
                </div>

                <div className="workflow-action">
                  <button 
                    onClick={handleJoinExistingMeeting}
                    className="meeting-cta-button meeting-cta-button--secondary"
                  >
                    <HiUserGroup className="cta-icon" />
                    Join Existing Meeting
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="meeting-features-section">
          <div className="features-header">
            <h2>Why Choose ChannelIQ Meetings?</h2>
            <p>Enterprise-grade features for professional collaboration</p>
          </div>
          
          <div className="meeting-features-grid">
            <div className="feature-card">
              <div className="feature-card-icon">
                <HiShieldCheck />
              </div>
              <h3>Enterprise Security</h3>
              <p>End-to-end encryption with advanced security controls</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon">
                <HiLightningBolt />
              </div>
              <h3>Lightning Fast</h3>
              <p>Ultra-low latency with global CDN infrastructure</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon">
                <HiGlobe />
              </div>
              <h3>Global Reach</h3>
              <p>Connect teams worldwide with 99.9% uptime guarantee</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon">
                <HiClock />
              </div>
              <h3>Smart Scheduling</h3>
              <p>Intelligent calendar integration and time zone support</p>
            </div>
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