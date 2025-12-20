import React, { useState, useEffect, useRef } from 'react';
import { HiSearch, HiPlus, HiDotsVertical } from 'react-icons/hi';
import { CreateGroupModal } from '../components/Chat/CreateGroupModal';
import { SearchGroupModal } from '../components/Chat/SearchGroupModal';
import { PendingRequestModal } from '../components/Chat/PendingRequestModal';
import { useGroups } from '../hooks/useGroups';
import { GroupDetailView } from '../components/Chat/GroupDetailView';

export const ChatPage: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { groups, currentGroup, getMyGroups, getGroupDetails, loading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);

  const handleGroupClick = async (userGroup: any) => {
    setSelectedGroupId(userGroup.groupId);
    setLoadingGroupDetails(true);
    try {
      await getGroupDetails(userGroup.groupId);
    } finally {
      setLoadingGroupDetails(false);
    }
  };

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

  const getGroupAvatar = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

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
          <div className="chat-groups-list">
            {loading ? (
              <div className="chat-loading">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="chat-empty">No groups found</div>
            ) : (
              groups.map(userGroup => (
                <div 
                  key={userGroup.id} 
                  className={`chat-group-item ${selectedGroupId === userGroup.groupId ? 'active' : ''}`}
                  onClick={() => handleGroupClick(userGroup)}
                >
                  <div className="chat-group-avatar">
                    {getGroupAvatar(userGroup.group.name)}
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
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {loadingGroupDetails ? (
            <div className="chat-welcome">
              <div className="chat-welcome-content">
                <div className="loading-spinner"></div>
                <p>Loading group details...</p>
              </div>
            </div>
          ) : currentGroup ? (
            <GroupDetailView group={currentGroup} />
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