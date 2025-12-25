import React, { useEffect } from 'react';
import { HiX, HiSpeakerphone } from 'react-icons/hi';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchAnnouncements } from '../../store/groupContentSlice';

interface AnnouncementsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

const AnnouncementsListModal: React.FC<AnnouncementsListModalProps> = ({ isOpen, onClose, groupId }) => {
  const dispatch = useAppDispatch();
  const { announcements } = useAppSelector(state => state.groupContent);

  useEffect(() => {
    if (isOpen && groupId) {
      dispatch(fetchAnnouncements(groupId));
    }
  }, [isOpen, groupId, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-group-modal" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>Group Announcements</h2>
          <button onClick={onClose} className="modal-close-btn">
            <HiX />
          </button>
        </div>

        <div className="create-group-form">
          {announcements.loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p>Loading announcements...</p>
            </div>
          ) : announcements.items.length === 0 ? (
            <div className="text-center py-8">
              <HiSpeakerphone className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No announcements found in this group</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.items.map((announcement) => (
                <div key={announcement.id} className="announcement-item">
                  <div className="announcement-header">
                    <h3 className="announcement-title">{announcement.title}</h3>
                    <div className="announcement-meta">
                      <span className="announcement-author">{announcement.createdBy?.fullName || 'Important'}</span>
                      <span className="announcement-date">{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="announcement-content">
                    <p>{announcement.content}</p>
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

export { AnnouncementsListModal };
export default AnnouncementsListModal;