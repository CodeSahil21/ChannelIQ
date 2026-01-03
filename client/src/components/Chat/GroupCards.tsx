import React from 'react';
import type { MyGroupMembership } from '../../types/group.types';
import { HiLockClosed, HiUsers } from 'react-icons/hi';

interface GroupCardProps {
  membership: MyGroupMembership;
  onClick?: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ membership, onClick }) => {
  const { group } = membership;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="group-card" onClick={onClick}>
      <div className="group-avatar">
        {group.imageUrl ? (
          <img src={group.imageUrl} alt={group.name} />
        ) : (
          <div className="group-avatar-initials">
            {getInitials(group.name)}
          </div>
        )}
      </div>
      
      <div className="group-info">
        <h3 className="group-name">{group.name}</h3>
        <div className="group-details">
          <span className="group-privacy">
            {group.isPrivate ? (
              <>
                <HiLockClosed className="privacy-icon" />
                Private
              </>
            ) : (
              'Public'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;