import React, { useState } from 'react';
import { HiX } from 'react-icons/hi';
import type { GroupDetailResponse, UpdateGroupRequest } from '../../types/group.types';

interface UpdateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupDetailResponse;
  onUpdate: (data: UpdateGroupRequest) => void;
}

const UpdateGroupModal: React.FC<UpdateGroupModalProps> = ({ isOpen, onClose, group, onUpdate }) => {
  const [formData, setFormData] = useState<UpdateGroupRequest>({
    name: group.name,
    description: group.description || '',
    imageUrl: group.imageUrl || '',
    isPrivate: group.isPrivate,
    maxMembers: group.maxMembers
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    // TODO: Replace with actual API call
    setTimeout(() => {
      onUpdate(formData);
      setIsUpdating(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="update-group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Group</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="update-group-form">
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              className="form-input"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Members</label>
            <input
              type="number"
              className="form-input"
              value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              min={group._count?.members || 2}
              max={1000}
            />
          </div>

          <div className="form-group">
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              />
              Private Group
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateGroupModal;