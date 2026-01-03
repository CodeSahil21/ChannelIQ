import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { HiSearch, HiPlus, HiDotsVertical, HiHome } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { CreateGroupModal } from '../components/Chat/CreateGroupModal';
import { SearchGroupModal } from '../components/Chat/SearchGroupModal';
import { PendingRequestModal } from '../components/Chat/PendingRequestModal';
import GroupCard from '../components/Chat/GroupCards';
import { useGroups } from '../hooks/useGroups';
import { GroupDetailView } from '../components/Chat/GroupDetailView';

// Memoized components to prevent unnecessary re-renders
const MemoizedGroupDetailView = memo(({ group }: { group: any }) => (
  <GroupDetailView group={group} />
));

const MemoizedGroupsList = memo(({ groups, selectedGroupId, onGroupClick, loading }: any) => (
  <div className="chat-groups-list">
    {loading ? (
      <div className="inline-loader">
        <div className="theme-loader small">
          <div className="theme-loader-spinner"></div>
        </div>
        <p className="theme-loader-text">Loading groups...</p>
      </div>
    ) : groups.length === 0 ? (
      <div className="chat-empty">No groups found</div>
    ) : (
      groups.map((userGroup: any) => (
        <GroupCard
          key={userGroup.id}
          membership={userGroup}
          onClick={() => onGroupClick(userGroup)}
        />
      ))
    )}
  </div>
));

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { groups, currentGroup, getMyGroups, getGroupDetails, loading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [localCurrentGroup, setLocalCurrentGroup] = useState<any>(null);

  // Filter groups based on search query
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groups;
    return groups.filter((userGroup: any) => 
      userGroup.group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  // Use full group details when available, fallback to local
  const displayGroup = currentGroup && currentGroup.id === selectedGroupId ? currentGroup : localCurrentGroup;

  const handleGroupClick = useCallback(async (userGroup: any) => {
    if (selectedGroupId === userGroup.groupId) return;
    
    setSelectedGroupId(userGroup.groupId);
    setLocalCurrentGroup(userGroup.group);
    // Fetch full details in background for details tab
    getGroupDetails(userGroup.groupId);
  }, [selectedGroupId, getGroupDetails]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    getMyGroups();
  }, [getMyGroups]);

  useEffect(() => {
    document.body.classList.add('chat-page');
    return () => {
      document.body.classList.remove('chat-page');
    };
  }, []);

  return (
    <div className='chat-page-container'>
      <div className="chat-container">
        {/* Left Sidebar */}
        <div className="chat-sidebar">
          {/* Header */}
          <div className="chat-sidebar-header">
            <div className="chat-header-top">
              <h1 className="chat-sidebar-title">Corporate Chat</h1>
              <div className="chat-header-actions">
                <button 
                  className="chat-action-btn"
                  onClick={() => navigate('/dashboard')}
                  title="Go to Home"
                >
                  <HiHome />
                </button>
                <button 
                  className="chat-action-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  <HiPlus />
                </button>
                <div className="chat-dropdown-wrapper" ref={dropdownRef}>
                  <button 
                    className="chat-action-btn"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <HiDotsVertical />
                  </button>
                  {showDropdown && (
                    <div className="chat-dropdown">
                      <button 
                        className="chat-dropdown-item" 
                        onClick={() => {
                          setShowSearchModal(true);
                          setShowDropdown(false);
                        }}
                      >
                        Search Groups
                      </button>
                      <button 
                        className="chat-dropdown-item" 
                        onClick={() => {
                          setShowPendingModal(true);
                          setShowDropdown(false);
                        }}
                      >
                        Pending Requests
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Search */}
            <div className="chat-search-wrapper">
              <HiSearch className="chat-search-icon" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="chat-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Groups Header */}
          <div className="chat-groups-header">
            <h2 className="chat-groups-title">Groups</h2>
            <span className="chat-groups-count">{groups.length}</span>
          </div>

          {/* Groups List */}
          <MemoizedGroupsList 
            groups={filteredGroups}
            selectedGroupId={selectedGroupId}
            onGroupClick={handleGroupClick}
            loading={loading}
          />
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {displayGroup ? (
            <MemoizedGroupDetailView group={displayGroup} />
          ) : (
            <div className="chat-welcome">
              <div className="chat-welcome-content">
                <div className="chat-welcome-icon">💬</div>
                <h2 className="chat-welcome-title">Welcome to Corporate Chat</h2>
                <p className="chat-welcome-description">
                  Select a group to start chatting with your team
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={() => {
          getMyGroups();
        }}
      />

      <SearchGroupModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      <PendingRequestModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
      />
    </div>
  );
};

const ChatPageComponent = ChatPage;
export default ChatPageComponent;