import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { HiSearch, HiPlus, HiDotsVertical } from 'react-icons/hi';
import { CreateGroupModal } from '../components/Chat/CreateGroupModal';
import { SearchGroupModal } from '../components/Chat/SearchGroupModal';
import { PendingRequestModal } from '../components/Chat/PendingRequestModal';
import { useGroups } from '../hooks/useGroups';
import { GroupDetailView } from '../components/Chat/GroupDetailView';

// Memoized components to prevent unnecessary re-renders
const MemoizedGroupDetailView = memo(GroupDetailView);
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
        <div 
          key={userGroup.id} 
          className={`chat-group-item ${selectedGroupId === userGroup.groupId ? 'active' : ''}`}
          onClick={() => onGroupClick(userGroup)}
        >
          <div className="chat-group-avatar">
            {userGroup.group.name.split(' ').map((word: string) => word[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="chat-group-info">
            <div className="chat-group-header">
              <h3 className="chat-group-name">{userGroup.group.name}</h3>
              <span className="chat-group-time">{new Date(userGroup.joinedAt).toLocaleDateString()}</span>
            </div>
            <div className="chat-group-footer">
              <p className="chat-group-message">
                {userGroup.group.description || 'No description'}
              </p>
              {userGroup.group._count && (
                <span className="chat-member-count">{userGroup.group._count.members} members</span>
              )}
            </div>
          </div>
        </div>
      ))
    )}
  </div>
));

export const ChatPage: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { groups, currentGroup, getMyGroups, getGroupDetails, loading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const handleGroupClick = useCallback(async (userGroup: any) => {
    if (selectedGroupId === userGroup.groupId) return;
    
    setSelectedGroupId(userGroup.groupId);
    await getGroupDetails(userGroup.groupId);
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
            groups={groups}
            selectedGroupId={selectedGroupId}
            onGroupClick={handleGroupClick}
            loading={loading}
          />
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {currentGroup ? (
            <MemoizedGroupDetailView group={currentGroup} />
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