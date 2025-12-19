import React, { useState } from 'react';
import { HiUserAdd } from 'react-icons/hi';
import type { UserSearchResult } from '../../types/user.types';

interface InviteUserCardProps {
  user: UserSearchResult;
  onInvite: (userId: number, message?: string) => void;
}

const InviteUserCard: React.FC<InviteUserCardProps> = ({ user, onInvite }) => {
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleInvite = async () => {
    setIsInviting(true);
    await onInvite(user.id, message);
    setIsInviting(false);
    setShowMessageInput(false);
    setMessage('');
  };

  return (
    <div className="invite-user-card">
      <div className="invite-user-content">
        <div className="invite-user-avatar">
          {user.profilePic ? (
            <img src={user.profilePic} alt={user.fullName || 'User'} />
          ) : (
            <div className="invite-user-avatar-initials">
              {getInitials(user.fullName || user.email)}
            </div>
          )}
        </div>
        
        <div className="invite-user-info">
          <h3 className="invite-user-name">{user.fullName || user.email}</h3>
          <p className="invite-user-email">{user.email}</p>
          {user.jobTitle && <p className="invite-user-job">{user.jobTitle}</p>}
          {user.department && <p className="invite-user-dept">{user.department}</p>}
        </div>
      </div>

      <div className="invite-user-actions">
        {showMessageInput && (
          <textarea
            className="invite-message-input"
            placeholder="Optional invitation message..."
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            maxLength={200}
            rows={2}
          />
        )}
        
        <div className="invite-buttons">
          {!showMessageInput ? (
            <>
              <button
                className="btn btn-primary invite-btn"
                onClick={() => setShowMessageInput(true)}
              >
                <HiUserAdd />
                Invite
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowMessageInput(false);
                  setMessage('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleInvite}
                disabled={isInviting}
              >
                {isInviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { InviteUserCard };
export default InviteUserCard;