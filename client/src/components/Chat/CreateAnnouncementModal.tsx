import React, { useState } from 'react';
import { HiX } from 'react-icons/hi';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createAnnouncement } from '../../store/groupContentSlice';
import type { CreateAnnouncementRequest } from '../../types';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onAnnouncementCreated?: () => void;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ 
  isOpen, 
  onClose, 
  groupId,
  onAnnouncementCreated
}) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.groupContent.announcements);
  
  const [formData, setFormData] = useState<CreateAnnouncementRequest>({
    title: '',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    const announcementData = {
      title: formData.title.trim(),
      content: formData.content.trim()
    };

    try {
      await dispatch(createAnnouncement({ groupId, announcementData })).unwrap();
      onAnnouncementCreated?.();
      onClose();
      setFormData({ title: '', content: '' });
    } catch (error) {
      console.error('Failed to create announcement:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-group-modal">
        <div className="modal-header">
          <h2>Create Announcement</h2>
          <button onClick={onClose} className="modal-close-btn">
            <HiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-group-form">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter announcement title"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea
              className="form-textarea"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter announcement content"
              maxLength={1000}
              rows={6}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {formData.content.length}/1000 characters
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { CreateAnnouncementModal };
export default CreateAnnouncementModal;