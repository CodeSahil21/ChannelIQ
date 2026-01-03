import React, { useState } from 'react';
import type { GroupDetailResponse } from '../../types/group.types';
import { HiLockClosed, HiUsers, HiCalendar, HiPencil, HiTrash, HiUserAdd, HiCamera } from 'react-icons/hi';
import { GroupImageModal } from './GroupImageModal';

interface GroupProfileProps {
  group: GroupDetailResponse;
  onUpdate?: () => void;
  onDelete?: () => void;
  onAddMembers?: () => void;
  canManage?: boolean;
  isCreator?: boolean;
  onImageUpdate?: (imageUrl: string | null) => void;
}

const GroupProfile: React.FC<GroupProfileProps> = ({ 
  group, 
  onUpdate, 
  onDelete, 
  onAddMembers, 
  canManage = false, 
  isCreator = false,
  onImageUpdate 
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  
  const handleOpenModal = () => {
    // Image modal opened
    setShowImageModal(true);
  };
  
  const handleCloseModal = () => {
    // Image modal closed
    setShowImageModal(false);
  };
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };



  return (
    <div className="group-profile-card">
      <div className="group-profile-header">
        <div className="group-profile-avatar" onClick={isCreator ? handleOpenModal : undefined} style={isCreator ? { cursor: 'pointer' } : {}}>
          {group.imageUrl ? (
            <img src={group.imageUrl} alt={group.name} />
          ) : (
            <div className="group-profile-avatar-initials">
              {getInitials(group.name)}
            </div>
          )}
          {isCreator && (
            <div className="avatar-edit-btn" onClick={(e) => { e.stopPropagation(); handleOpenModal(); }}>
              <HiCamera />
            </div>
          )}
        </div>
        
        <div className="group-profile-info">
          <h2 className="group-profile-name">{group.name}</h2>
          {group.description && (
            <p className="group-profile-description">{group.description}</p>
          )}
          
          <div className="group-profile-meta">
            <div className="group-meta-item">
              {group.isPrivate ? (
                <>
                  <HiLockClosed className="meta-icon" />
                  <span>Private Group</span>
                </>
              ) : (
                <>
                  <HiUsers className="meta-icon" />
                  <span>Public Group</span>
                </>
              )}
            </div>
            
            <div className="group-meta-item">
              <HiUsers className="meta-icon" />
              <span>{group._count?.members || 0} members</span>
            </div>
            
            <div className="group-meta-item">
              <HiCalendar className="meta-icon" />
              <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="group-actions">
          {isCreator && (
            <button 
              className="btn btn-primary" 
              onClick={handleOpenModal}
            >
              <HiCamera />
              Edit Image
            </button>
          )}
          <button className="btn btn-primary" onClick={onAddMembers}>
            <HiUserAdd />
            Add Members
          </button>
          <button className="btn btn-primary" onClick={onUpdate}>
            <HiPencil />
            Update Group
          </button>
          <button className="btn delete-btn" onClick={onDelete}>
            <HiTrash />
            Delete Group
          </button>
        </div>
      )}
      
      <GroupImageModal
        isOpen={showImageModal}
        onClose={handleCloseModal}
        groupId={group.id}
        currentImageUrl={group.imageUrl}
        onImageUpdate={(imageUrl) => {
          if (onImageUpdate) {
            onImageUpdate(imageUrl);
          }
        }}
      />
    </div>
  );
};

export default GroupProfile;