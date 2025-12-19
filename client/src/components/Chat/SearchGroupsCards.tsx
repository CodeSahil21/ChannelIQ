import React, { useState } from 'react';
import type { SearchGroupItem } from '../../types/group.types';
import { HiUsers, HiUserAdd } from 'react-icons/hi';
import { useGroups } from '../../hooks/useGroups';

interface SearchGroupsCardsProps {
  group: SearchGroupItem;
}

const SearchGroupsCards: React.FC<SearchGroupsCardsProps> = ({ group }) => {
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const { joinGroup } = useGroups();

  const handleJoinGroup = async () => {
    setIsJoining(true);
    const success = await joinGroup(group.id, message);
    if (success) {
      setMessage('');
    }
    setIsJoining(false);
  };

  return (
    <div className="search-group-card">
      <div className="search-group-content">
        <div className="search-group-avatar">
          {group.imageUrl ? (
            <img src={group.imageUrl} alt={group.name} />
          ) : (
            <div className="search-group-avatar-initials">
              {getInitials(group.name)}
            </div>
          )}
        </div>
        
        <div className="search-group-info">
          <h3 className="search-group-name">{group.name}</h3>
          {group.description && (
            <p className="search-group-description">{group.description}</p>
          )}
          <div className="search-group-meta">
            <span className="search-group-members">
              <HiUsers className="members-icon" />
              {group._count?.members || 0} members
            </span>
            <span className="search-group-creator">
              Created by {group.creator?.fullName || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="search-group-actions">
        <textarea
          className="join-message-input"
          placeholder="Optional message (max 200 chars)"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          maxLength={200}
        />
        <button
          className="join-group-btn"
          onClick={handleJoinGroup}
          disabled={isJoining}
        >
          <HiUserAdd />
          {isJoining ? 'Joining...' : 'Join Group'}
        </button>
      </div>
    </div>
  );
};

export { SearchGroupsCards };
export default SearchGroupsCards;