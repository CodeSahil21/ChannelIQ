import { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaClock, FaPaperPlane, FaBan, FaSearch } from 'react-icons/fa';
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

export const Connections = () => {
  const [activeTab, setActiveTab] = useState<Tab>('connections');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const tabs = [
    { id: 'connections' as Tab, label: 'Connections', icon: FaUsers },
    { id: 'pending' as Tab, label: 'Requests', icon: FaClock },
    { id: 'sent' as Tab, label: 'Sent', icon: FaPaperPlane },
    { id: 'blocked' as Tab, label: 'Blocked', icon: FaBan },
  ];

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="connections-header">
          <h1 className="connections-page-title">My Network</h1>
          <button onClick={() => setShowSearch(true)} className="search-users-btn">
            <FaSearch /> Search Users
          </button>
        </div>

        <div className="connections-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`connections-tab ${isActive ? 'active' : ''}`}
              >
                <Icon className="tab-icon" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'connections' && <ConnectionsList />}
            {activeTab === 'pending' && <PendingRequests />}
            {activeTab === 'sent' && <SentRequests />}
            {activeTab === 'blocked' && <BlockedUsers />}
          </motion.div>
        </AnimatePresence>

        <SearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onUserClick={(userId) => setSelectedUserId(userId)}
        />

        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      </div>
    </Layout>
  );
};

const ConnectionsWithContext = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('connections');
  const [showSearch, setShowSearch] = useState(false);

  const tabs = [
    { id: 'connections' as Tab, label: 'Connections', icon: FaUsers },
    { id: 'pending' as Tab, label: 'Requests', icon: FaClock },
    { id: 'sent' as Tab, label: 'Sent', icon: FaPaperPlane },
    { id: 'blocked' as Tab, label: 'Blocked', icon: FaBan },
  ];

  return (
    <ProfileContext.Provider value={setSelectedUserId}>
      <Layout>
        <div className="dashboard-container">
          <div className="connections-header">
            <h1 className="connections-page-title">My Network</h1>
            <button onClick={() => setShowSearch(true)} className="search-users-btn">
              <FaSearch /> Search Users
            </button>
          </div>

          <div className="connections-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`connections-tab ${isActive ? 'active' : ''}`}
                >
                  <Icon className="tab-icon" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'connections' && <ConnectionsList />}
              {activeTab === 'pending' && <PendingRequests />}
              {activeTab === 'sent' && <SentRequests />}
              {activeTab === 'blocked' && <BlockedUsers />}
            </motion.div>
          </AnimatePresence>

          <SearchModal
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            onUserClick={(userId) => setSelectedUserId(userId)}
          />

          <UserProfileModal
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        </div>
      </Layout>
    </ProfileContext.Provider>
  );
};

export default ConnectionsWithContext;
