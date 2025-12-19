import React, { useState } from 'react';
import type { PendingRequest } from '../../types/group.types';
import { HiCheck, HiX, HiUsers } from 'react-icons/hi';

interface PendingRequestCardProps {
  request: PendingRequest;
  onRespond: (requestId: string, status: 'ACCEPTED' | 'REJECTED') => void;
}

const PendingRequestCard: React.FC<PendingRequestCardProps> = ({ request, onRespond }) => {
  const [isResponding, setIsResponding] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRespond = async (status: 'ACCEPTED' | 'REJECTED') => {
    setIsResponding(true);
    await onRespond(request.id, status);
    setIsResponding(false);
  };

  const isInvite = request.type === 'INVITE';
  const displayUser = isInvite ? request.sender : request.sender;
  const actionText = isInvite ? 'invited you to join' : 'wants to join';

  return (
    <div className="pending-request-card">
      <div className="request-content">
        <div className="request-user-avatar">
          {displayUser.profileUrl ? (
            <img src={displayUser.profileUrl} alt={displayUser.fullName} />
          ) : (
            <div className="request-avatar-initials">
              {getInitials(displayUser.fullName)}
            </div>
          )}
        </div>
        
        <div className="request-info">
          <div className="request-header">
            <h3 className="request-user-name">{displayUser.fullName}</h3>
            <span className="request-time">
              {new Date(request.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <p className="request-action">
            {actionText} <strong>{request.group.name}</strong>
          </p>
          
          {request.message && (
            <div className="request-message">
              "{request.message}"
            </div>
          )}
          
          <div className="request-group-info">
            <HiUsers className="group-icon" />
            <span>{request.group.isPrivate ? 'Private' : 'Public'} Group</span>
          </div>
        </div>
      </div>

      <div className="request-actions">
        <button
          className="btn-accept"
          onClick={() => handleRespond('ACCEPTED')}
          disabled={isResponding}
        >
          <HiCheck />
          Accept
        </button>
        <button
          className="btn-reject"
          onClick={() => handleRespond('REJECTED')}
          disabled={isResponding}
        >
          <HiX />
          Reject
        </button>
      </div>
    </div>
  );
};

export { PendingRequestCard };
export default PendingRequestCard;