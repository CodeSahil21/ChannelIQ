import { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaClock, FaPaperPlane, FaBan, FaSearch } from 'react-icons/fa';
import { HiUserGroup, HiLightningBolt, HiShieldCheck } from 'react-icons/hi';

import { Layout } from '../components/layout/Layout';
import { PendingRequests } from '../components/connections/PendingRequests';
import { SentRequests } from '../components/connections/SentRequests';
import { ConnectionsList } from '../components/connections/ConnectionsList';
import { BlockedUsers } from '../components/connections/BlockedUsers';
import { SearchModal } from '../components/search/SearchModal';
import { UserProfileModal } from '../components/search/UserProfileModal';

type Tab = 'connections' | 'pending' | 'sent' | 'blocked';

const ProfileContext = createContext<(userId: number) => void>(() => {});

export const useProfileContext = () => useContext(ProfileContext);

const ConnectionsWithContext = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('connections');
  const [showSearch, setShowSearch] = useState(false);

  const tabs = [
    { 
      id: 'connections' as Tab, 
      label: 'Connections', 
      icon: FaUsers 
    },
    { 
      id: 'pending' as Tab, 
      label: 'Requests', 
      icon: FaClock 
    },
    { 
      id: 'sent' as Tab, 
      label: 'Sent', 
      icon: FaPaperPlane 
    },
    { 
      id: 'blocked' as Tab, 
      label: 'Blocked', 
      icon: FaBan 
    },
  ];

  return (
    <ProfileContext.Provider value={setSelectedUserId}>
      <Layout>
        <div className="enhanced-connections-container">
          {/* Hero Section */}
          <div className="connections-hero-section">
            <div className="connections-hero-content">
              <div className="connections-hero-badge">
                <HiUserGroup className="hero-badge-icon" />
                <span>Professional Network</span>
              </div>
              
              <h1 className="connections-hero-title">
                Build Your Network
              </h1>
              
              <p className="connections-hero-subtitle">
                Connect with colleagues, collaborate on projects, and grow your professional relationships
              </p>
              
              <div className="connections-hero-features">
                <div className="hero-feature">
                  <HiShieldCheck className="hero-feature-icon" />
                  <span>Secure Connections</span>
                </div>
                
                <div className="hero-feature">
                  <HiLightningBolt className="hero-feature-icon" />
                  <span>Instant Messaging</span>
                </div>
              </div>
            </div>
            
            <div className="connections-hero-visual">
              <div className="network-visualization">
                <div className="network-node network-node--center">
                  <span>You</span>
                </div>
                
                <div className="network-node network-node--connected">
                  <span>Team</span>
                </div>
                
                <div className="network-node network-node--connected">
                  <span>Dept</span>
                </div>
                
                <div className="network-node network-node--pending">
                  <span>New</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="connections-actions-section">
            <div className="connections-header">
              <div className="connections-header-content">
                <span className="connections-section-title" style={{ fontWeight: 400 }}>My Network</span>
                
                <button 
                  onClick={() => setShowSearch(true)} 
                  className="enhanced-search-btn"
                  style={{ marginTop: '16px' }}
                >
                  <FaSearch className="search-btn-icon" />
                  <span>Find Colleagues</span>
                </button>
              </div>
            </div>

            <div className="enhanced-connections-tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`enhanced-connections-tab ${
                      isActive ? 'enhanced-connections-tab--active' : ''
                    }`}
                  >
                    <Icon className="enhanced-tab-icon" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="connections-tab-content">
              <div className="tab-content-wrapper">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="tab-content-inner"
                  >
                    {activeTab === 'connections' && <ConnectionsList />}
                    {activeTab === 'pending' && <PendingRequests />}
                    {activeTab === 'sent' && <SentRequests />}
                    {activeTab === 'blocked' && <BlockedUsers />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <SearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onUserClick={(userId) => setSelectedUserId(userId)}
        />

        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      </Layout>
    </ProfileContext.Provider>
  );
};

export default ConnectionsWithContext;
