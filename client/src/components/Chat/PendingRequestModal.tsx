import React, { useState, useEffect } from 'react';
import { HiX, HiMail, HiUserAdd } from 'react-icons/hi';
import { PendingRequestCard } from './PendingRequestCard';
import { useGroups } from '../../hooks/useGroups';
import type { RequestType } from '../../types/group.types';

interface PendingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PendingRequestModal: React.FC<PendingRequestModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<RequestType>('invites');
  const { pendingRequests, loading, getPendingRequests, respondToRequest } = useGroups();



  const handleRespondToRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    await respondToRequest(requestId, status);
  };

  useEffect(() => {
    if (isOpen) {
      getPendingRequests();
    }
  }, [isOpen, getPendingRequests]);

  if (!isOpen) return null;

  const currentRequests = pendingRequests ? pendingRequests[activeTab] : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pending-request-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pending-modal-header">
          <h2>Pending Requests</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="pending-tabs">
          <button
            className={`pending-tab ${activeTab === 'invites' ? 'active' : ''}`}
            onClick={() => setActiveTab('invites')}
          >
            <HiMail className="tab-icon" />
            Invitations ({pendingRequests?.invites.length || 0})
          </button>
          <button
            className={`pending-tab ${activeTab === 'joinRequests' ? 'active' : ''}`}
            onClick={() => setActiveTab('joinRequests')}
          >
            <HiUserAdd className="tab-icon" />
            Join Requests ({pendingRequests?.joinRequests.length || 0})
          </button>
        </div>

        <div className="pending-content">
          {loading ? (
            <div className="pending-loading">
              <div className="loading-spinner"></div>
              <p>Loading requests...</p>
            </div>
          ) : currentRequests.length === 0 ? (
            <div className="pending-empty">
              <p>
                {activeTab === 'invites' 
                  ? 'No pending invitations' 
                  : 'No pending join requests'
                }
              </p>
            </div>
          ) : (
            <div className="pending-list">
              {currentRequests.map(request => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  onRespond={handleRespondToRequest}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PendingRequestModal };
export default PendingRequestModal;