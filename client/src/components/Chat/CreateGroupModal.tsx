import React, { useState } from 'react';
import { HiX } from 'react-icons/hi';
import { useGroups } from '../../hooks/useGroups';

interface CreateGroupRequest {
  name: string;
  description?: string;
  isPrivate?: boolean;
  maxMembers?: number;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const [formData, setFormData] = useState<CreateGroupRequest>({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 256
  });
  const { createGroup, loading } = useGroups();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }

    const success = await createGroup({
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      isPrivate: formData.isPrivate,
      maxMembers: formData.maxMembers
    });

    if (success) {
      onGroupCreated();
      onClose();
      setFormData({ name: '', description: '', isPrivate: false, maxMembers: 256 });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-group-modal">
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button onClick={onClose} className="modal-close-btn">
            <HiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-group-form">
          <div className="form-group">
            <label className="form-label">Group Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter group name"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter group description (optional)"
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Members</label>
            <input
              type="number"
              className="form-input"
              value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 256 })}
              min={2}
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
              <span>Private Group</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { CreateGroupModal };
export default CreateGroupModal;