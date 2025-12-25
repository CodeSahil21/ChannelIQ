import React, { useEffect } from 'react';
import { HiX, HiBookmark } from 'react-icons/hi';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchPinnedMessages, unpinMessage } from '../../store/groupContentSlice';
import toast from 'react-hot-toast';

interface PinnedMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  userRole?: string;
}

const PinnedMessagesModal: React.FC<PinnedMessagesModalProps> = ({ isOpen, onClose, groupId, userRole }) => {
  const dispatch = useAppDispatch();
  const { pinnedMessages } = useAppSelector(state => state.groupContent);
  const canUnpin = userRole === 'ADMIN' || userRole === 'CO_ADMIN';

  const handleUnpin = async (messageId: string) => {
    try {
      await dispatch(unpinMessage({ groupId, messageId })).unwrap();
      toast.success('Message unpinned');
    } catch (error) {
      toast.error('Failed to unpin message');
    }
  };

  useEffect(() => {
    if (isOpen && groupId) {
      dispatch(fetchPinnedMessages(groupId));
    }
  }, [isOpen, groupId, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-group-modal" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Pinned Messages</h2>
          <button onClick={onClose} className="modal-close-btn">
            <HiX />
          </button>
        </div>

        <div className="create-group-form">
          {pinnedMessages.loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p>Loading pinned messages...</p>
            </div>
          ) : pinnedMessages.items.length === 0 ? (
            <div className="text-center py-8">
              <HiBookmark className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pinned messages in this group</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pinnedMessages.items.map((pinnedMsg) => (
                <div key={pinnedMsg.id} className="pinned-message-card">
                  <div className="pinned-message-header">
                    <div className="pinned-message-info">
                      <HiBookmark className="text-blue-500" />
                      <span className="pinned-label">Pinned Message</span>
                    </div>
                    {canUnpin && (
                      <button 
                        onClick={() => handleUnpin(pinnedMsg.messageId)}
                        className="unpin-btn"
                        title="Unpin message"
                      >
                        <HiX />
                      </button>
                    )}
                  </div>
                  <div className="pinned-message-content">
                    <p className="message-text">{pinnedMsg.message?.content || 'No content'}</p>
                  </div>
                  <div className="pinned-message-footer">
                    <div className="message-author">
                      <span>By {pinnedMsg.message?.sender?.fullName || 'Unknown'}</span>
                      <span className="message-date">{new Date(pinnedMsg.message?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="pinned-info">
                      <span className="pinned-by">Pinned by {pinnedMsg.pinnedBy?.fullName || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PinnedMessagesModal };
export default PinnedMessagesModal;