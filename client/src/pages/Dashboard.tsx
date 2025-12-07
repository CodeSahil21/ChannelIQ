import React from 'react';
import { Layout } from '../components/layout/Layout';
import { HiShieldCheck, HiLightningBolt, HiUserGroup, HiGlobe } from 'react-icons/hi';

export const Dashboard: React.FC = () => {
  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-welcome-card">
          <div className="welcome-header">
            <h1 className="welcome-title">Welcome to Corporate Chat</h1>
            <p className="welcome-subtitle">
              Your professional communication platform for seamless collaboration
            </p>
          </div>
          
          <div className="dashboard-stats">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-text">Messages Sent</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-text">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-text">Uptime</div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-features">
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <HiShieldCheck className="feature-icon" />
            </div>
            <h3>Secure Communication</h3>
            <p>Enterprise-grade security with end-to-end encryption</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <HiLightningBolt className="feature-icon" />
            </div>
            <h3>Real-Time Messaging</h3>
            <p>Instant communication with zero latency</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <HiUserGroup className="feature-icon" />
            </div>
            <h3>Team Collaboration</h3>
            <p>Connect with colleagues across departments</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <HiGlobe className="feature-icon" />
            </div>
            <h3>Global Access</h3>
            <p>Work from anywhere with cloud-based platform</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
