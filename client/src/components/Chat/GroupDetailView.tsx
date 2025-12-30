import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { HiInformationCircle, HiUsers, HiDotsVertical, HiUserRemove, HiLogout, HiVolumeOff, HiVolumeUp, HiCog, HiChat } from 'react-icons/hi';
import GroupProfile from './GroupProfile';
import UpdateGroupModal from './UpdateGroupModal';
import DeleteGroupModal from './DeleteGroupModal';
import AddMembersModal from './AddMembersModal';
import RemoveMemberModal from './RemoveMemberModal';
import LeaveGroupModal from './LeaveGroupModal';
import { PollsListModal, AnnouncementsListModal, PinnedMessagesModal } from './index';
import { ChatProvider, useChatContext } from './ChatProvider';
import { ChatMessages } from './ChatMessages';
import type { Group, UpdateGroupRequest } from '../../types/group.types';
import type { RootState } from '../../store';
import { useGroups } from '../../hooks/useGroups';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { updateGroupImage } from '../../store/groupSlice';

type GroupDetailTab = 'details' | 'members' | 'messages';

interface GroupDetailViewProps {
  group: Group;
}

const GroupDetailView: React.FC<GroupDetailViewProps> = ({ group }) => {
  const [activeTab, setActiveTab] = useState<GroupDetailTab>('messages');
  const { updateMemberRole, updateMemberSettings, handleImageUpdate, currentGroup } = useGroups();
  
  // Use full group details when available, fallback to prop
  const fullGroup = currentGroup && currentGroup.id === group.id ? currentGroup : group;
  const dispatch = useAppDispatch();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);
  const [showPollsModal, setShowPollsModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showPinnedMessagesModal, setShowPinnedMessagesModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: number; name: string } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { updateGroup, deleteGroup, leaveGroup } = useGroups();

  const handleUpdateGroup = async (data: UpdateGroupRequest) => {
    await updateGroup(group.id, data);
  };

  const handleDeleteGroup = async () => {
    await deleteGroup(group.id);
  };

  const handleRemoveMemberClick = (userId: number, userName: string) => {
    setMemberToRemove({ userId, name: userName });
    setShowRemoveMemberModal(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (memberToRemove) {
      await leaveGroup(group.id, memberToRemove.userId);
    }
    setShowRemoveMemberModal(false);
    setMemberToRemove(null);
  };

  const handleLeaveGroupClick = () => {
    setShowLeaveGroupModal(true);
  };

  const handleConfirmLeaveGroup = async () => {
    if (currentUserId) {
      await leaveGroup(group.id, currentUserId);
    }
    setShowLeaveGroupModal(false);
  };

  const handleRoleChange = async (userId: number, newRole: 'ADMIN' | 'CO_ADMIN' | 'MEMBER') => {
    await updateMemberRole(group.id, userId, newRole);
  };

  const handleMuteToggle = async (userId: number) => {
    const member = group.members?.find(m => m.userId === userId);
    const newMutedState = !member?.isMuted;
    await updateMemberSettings(group.id, newMutedState);
  };

  const currentUser = useSelector((state: RootState) => state.user.user);
  const currentUserId = currentUser ? parseInt(String(currentUser.id)) : null;
  const currentUserMembership = currentUserId ? fullGroup.members?.find(m => m.userId === currentUserId) : null;
  const isCreator = currentUserId !== null && fullGroup.creatorId === currentUserId;
  const isMember = currentUserMembership !== null;

  return (
    <ChatProvider>
      <div className="group-detail-view">
        <div className="group-detail-header">
          <div className="group-detail-tabs">
            <button
              className={`group-detail-tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <HiChat className="tab-icon" />
              Messages
            </button>
            <button
              className={`group-detail-tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <HiInformationCircle className="tab-icon" />
              Details
            </button>
          </div>
        </div>

        <div className="group-detail-content">
          {activeTab === 'messages' && (
            <ChatMessagesWrapper 
              groupId={fullGroup.id} 
              userRole={currentUserMembership?.role}
              onShowPolls={() => setShowPollsModal(true)}
              onShowAnnouncements={() => setShowAnnouncementsModal(true)}
              onShowPinnedMessages={() => setShowPinnedMessagesModal(true)}
            />
          )}
          
          {activeTab === 'details' && (
            <div className="details-tab-content">
          <GroupProfile 
            group={fullGroup} 
            onUpdate={() => setShowUpdateModal(true)}
            onDelete={() => setShowDeleteModal(true)}
            onAddMembers={() => setShowAddMembersModal(true)}
            canManage={isCreator}
            isCreator={isCreator}
            onImageUpdate={(imageUrl) => {
              handleImageUpdate(fullGroup.id, imageUrl);
            }}
          />
          
          {/* Members Section */}
          <div className="members-section" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <h3>Members ({fullGroup._count?.members || 0})</h3>
            <div className="members-list-container">
              {fullGroup.members?.map(member => {
                const currentUserMembership = fullGroup.members?.find(m => m.userId === currentUserId);
                const currentUserRole = currentUserMembership?.role || 'MEMBER';
                const memberIsCreator = fullGroup.creatorId === currentUserId;
                
                const getInitials = (name: string) => {
                  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
                };
                
                const getRoleBadge = (role: string) => {
                  const badges = {
                    ADMIN: { text: 'Admin', class: 'role-admin' },
                    CO_ADMIN: { text: 'Co-Admin', class: 'role-co-admin' },
                    MEMBER: { text: 'Member', class: 'role-member' }
                  };
                  return badges[role as keyof typeof badges] || badges.MEMBER;
                };
                
                return (
                  <div key={member.id} className="member-list-item">
                    <div className="member-item-avatar">
                      {member.user.profileUrl ? (
                        <img src={member.user.profileUrl} alt={member.user.fullName} />
                      ) : (
                        <div className="member-item-initials">
                          {getInitials(member.user.fullName)}
                        </div>
                      )}
                    </div>
                    
                    <div className="member-item-info">
                      <div className="member-item-name-row">
                        <span className="member-item-name">{member.user.fullName}</span>
                        <span className={`role-badge ${getRoleBadge(member.role).class}`}>
                          {getRoleBadge(member.role).text}
                        </span>
                      </div>
                      <div className="member-item-details">
                        <span className="member-item-email">{member.user.email}</span>
                        {member.isMuted && <span className="muted-indicator">Muted</span>}
                      </div>
                    </div>

                    {isCreator && member.userId !== currentUserId && (
                      <div className="member-item-actions" style={{ position: 'relative' }}>
                        <button 
                          className="member-dots-btn"
                          onClick={() => setActiveDropdown(activeDropdown === member.userId ? null : member.userId)}
                        >
                          <HiDotsVertical />
                        </button>
                        
                        {activeDropdown === member.userId && (
                          <div 
                            ref={dropdownRef}
                            className="member-dropdown"
                            style={{
                              position: 'absolute',
                              right: '0',
                              top: '100%',
                              backgroundColor: 'white',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              zIndex: 1000,
                              minWidth: '150px'
                            }}
                          >
                            <button 
                              className="member-dropdown-item"
                              onClick={() => {
                                handleRoleChange(member.userId, 'CO_ADMIN');
                                setActiveDropdown(null);
                              }}
                            >
                              <HiCog />
                              Make Co-Admin
                            </button>
                            <button 
                              className="member-dropdown-item"
                              onClick={() => {
                                handleRoleChange(member.userId, 'MEMBER');
                                setActiveDropdown(null);
                              }}
                            >
                              <HiCog />
                              Make Member
                            </button>
                            <button 
                              className="member-dropdown-item"
                              onClick={() => {
                                handleMuteToggle(member.userId);
                                setActiveDropdown(null);
                              }}
                            >
                              {member.isMuted ? <HiVolumeUp /> : <HiVolumeOff />}
                              {member.isMuted ? 'Unmute' : 'Mute'}
                            </button>
                            <button 
                              className="member-dropdown-item danger"
                              onClick={() => {
                                handleRemoveMemberClick(member.userId, member.user.fullName);
                                setActiveDropdown(null);
                              }}
                            >
                              <HiUserRemove />
                              Remove Member
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!isCreator && isMember && (
              <div className="leave-group-section" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                <button 
                  className="btn leave-group-btn"
                  onClick={handleLeaveGroupClick}
                  style={{
                    padding: '12px 24px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fecaca';
                    e.currentTarget.style.color = '#b91c1c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                >
                  <HiLogout style={{ marginRight: '8px' }} />
                  Leave Group
                </button>
              </div>
            )}
          </div>
            </div>
          )}
        </div>

      <UpdateGroupModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        group={fullGroup}
        onUpdate={handleUpdateGroup}
      />
      
      <DeleteGroupModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        group={fullGroup}
        onDelete={handleDeleteGroup}
      />
      
      <AddMembersModal
        isOpen={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        groupId={fullGroup.id}
      />
      
      <RemoveMemberModal
        isOpen={showRemoveMemberModal}
        onClose={() => {
          setShowRemoveMemberModal(false);
          setMemberToRemove(null);
        }}
        memberName={memberToRemove?.name || ''}
        onConfirm={handleConfirmRemoveMember}
      />
      
      <LeaveGroupModal
        isOpen={showLeaveGroupModal}
        onClose={() => setShowLeaveGroupModal(false)}
        groupName={fullGroup.name}
        onConfirm={handleConfirmLeaveGroup}
      />
      
      <PollsListModal
        isOpen={showPollsModal}
        onClose={() => setShowPollsModal(false)}
        groupId={fullGroup.id}
      />
      
      <PinnedMessagesModal
        isOpen={showPinnedMessagesModal}
        onClose={() => setShowPinnedMessagesModal(false)}
        groupId={fullGroup.id}
        userRole={currentUserMembership?.role}
      />
      <AnnouncementsListModal
        isOpen={showAnnouncementsModal}
        onClose={() => setShowAnnouncementsModal(false)}
        groupId={fullGroup.id}
      />
      </div>
    </ChatProvider>

  );
};

export { GroupDetailView };
export default GroupDetailView;

// Wrapper component to handle chat context
const ChatMessagesWrapper: React.FC<{ 
  groupId: string;
  userRole?: string;
  onShowPolls?: () => void;
  onShowAnnouncements?: () => void;
  onShowPinnedMessages?: () => void;
}> = ({ groupId, userRole, onShowPolls, onShowAnnouncements, onShowPinnedMessages }) => {
  const { joinGroup, currentGroupId } = useChatContext();
  
  useEffect(() => {
    if (groupId && groupId !== currentGroupId) {
      joinGroup(groupId);
    }
  }, [groupId, currentGroupId, joinGroup]);
  
  return (
    <ChatMessages 
      groupId={groupId}
      userRole={userRole}
      onShowPolls={onShowPolls}
      onShowAnnouncements={onShowAnnouncements}
      onShowPinnedMessages={onShowPinnedMessages}
    />
  );
};