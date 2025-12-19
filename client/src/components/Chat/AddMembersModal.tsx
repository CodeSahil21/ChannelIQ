import React, { useState, useEffect } from 'react';
import { HiX, HiSearch } from 'react-icons/hi';
import { InviteUserCard } from './InviteUserCard';
import { useUserSearch } from '../../hooks/useUserSearch';
import { useGroups } from '../../hooks/useGroups';



interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

const AddMembersModal: React.FC<AddMembersModalProps> = ({ isOpen, onClose, groupId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchResults, loading, searchUsers, clearResults } = useUserSearch();
  const { inviteUser } = useGroups();



  const handleInviteUser = async (userId: number, message?: string) => {
    const success = await inviteUser(groupId, userId, message);
    if (success) {
      // Refresh search to remove invited user from results
      if (searchQuery.length >= 2) {
        searchUsers(searchQuery);
      }
    }
  };

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      clearResults();
    }
  }, [searchQuery, searchUsers, clearResults]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      clearResults();
    }
  }, [isOpen, clearResults]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-members-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Members</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="search-input-wrapper">
          <HiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search users by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="search-results">
          {loading ? (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <p>Searching users...</p>
            </div>
          ) : searchQuery.length < 2 ? (
            <div className="search-empty">
              <p>Enter at least 2 characters to search for users</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="search-empty">
              <p>No users found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="invite-users-list">
              {searchResults.map(user => (
                <InviteUserCard
                  key={user.id}
                  user={user}
                  onInvite={handleInviteUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { AddMembersModal };
export default AddMembersModal;