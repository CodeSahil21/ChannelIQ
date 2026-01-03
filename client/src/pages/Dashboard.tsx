import React from 'react';
import { Layout } from '../components/layout/Layout';
import { HiShieldCheck, HiLightningBolt, HiUserGroup, HiGlobe, HiVideoCamera, HiChat, HiUsers } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="enhanced-dashboard-container">
        {/* Hero Section */}
        <div className="dashboard-hero-section">
          <div className="dashboard-hero-content">
            <div className="dashboard-hero-badge">
              <HiLightningBolt className="hero-badge-icon" />
              <span>ChannelIQ Platform</span>
            </div>
            <h1 className="dashboard-hero-title">
              Welcome to ChannelIQ
            </h1>
            <p className="dashboard-hero-subtitle">
              Your professional communication platform for seamless collaboration and team connectivity
            </p>
            <div className="dashboard-hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">10K+</span>
                <span className="hero-stat-label">Messages</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">500+</span>
                <span className="hero-stat-label">Users</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">99.9%</span>
                <span className="hero-stat-label">Uptime</span>
              </div>
            </div>
          </div>
          <div className="dashboard-hero-visual">
            <div className="hero-feature-grid">
              <div className="hero-feature-tile hero-feature-tile--main">
                <HiChat className="feature-tile-icon" />
                <span className="feature-tile-name">Chat</span>
              </div>
              <div className="hero-feature-tile">
                <HiVideoCamera className="feature-tile-icon" />
                <span className="feature-tile-name">Meetings</span>
              </div>
              <div className="hero-feature-tile">
                <HiUsers className="feature-tile-icon" />
                <span className="feature-tile-name">Teams</span>
              </div>
              <div className="hero-feature-tile">
                <HiUserGroup className="feature-tile-icon" />
                <span className="feature-tile-name">Groups</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-actions-section">
          <div className="actions-header">
            <h2>Quick Actions</h2>
            <p>Get started with your most common tasks</p>
          </div>
          
          <div className="dashboard-actions-grid">
            <div className="action-card" onClick={() => navigate('/chat')}>
              <div className="action-card-icon">
                <HiChat />
              </div>
              <h3>Start Chatting</h3>
              <p>Connect with your team through instant messaging</p>
              <div className="action-card-arrow">→</div>
            </div>
            
            <div className="action-card" onClick={() => navigate('/meetings')}>
              <div className="action-card-icon">
                <HiVideoCamera />
              </div>
              <h3>Join Meeting</h3>
              <p>Start or join video conferences with your colleagues</p>
              <div className="action-card-arrow">→</div>
            </div>
            
            <div className="action-card" onClick={() => navigate('/connections')}>
              <div className="action-card-icon">
                <HiUserGroup />
              </div>
              <h3>Manage Connections</h3>
              <p>Build your professional network within the organization</p>
              <div className="action-card-arrow">→</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="dashboard-features-section">
          <div className="features-header">
            <h2>Platform Features</h2>
            <p>Everything you need for professional communication</p>
          </div>
          
          <div className="dashboard-features-grid">
            <div className="feature-card">
              <div className="feature-card-icon">
                <HiShieldCheck />
              </div>
              <h3>Enterprise Security</h3>
              <p>End-to-end encryption with advanced security controls and compliance</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon">
                <HiLightningBolt />
              </div>
              <h3>Real-Time Messaging</h3>
              <p>Instant communication with zero latency and reliable delivery</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon">
                <HiUserGroup />
              </div>
              <h3>Team Collaboration</h3>
              <p>Connect with colleagues across departments and projects</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon">
                <HiGlobe />
              </div>
              <h3>Global Access</h3>
              <p>Work from anywhere with our cloud-based platform</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
export { Dashboard };
