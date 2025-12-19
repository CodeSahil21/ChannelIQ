import React, { useState } from 'react';
import { HiX, HiExclamationCircle } from 'react-icons/hi';
import type { GroupDetailResponse } from '../../types/group.types';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupDetailResponse;
  onDelete: () => void;
}

const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({ isOpen, onClose, group, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    
    // TODO: Replace with actual API call
    setTimeout(() => {
      onDelete();
      setIsDeleting(false);
      onClose();
    }, 1000);
  };

  const isConfirmed = confirmText === group.name;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="warning-icon">
            <HiExclamationCircle />
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="modal-content">
          <h2 className="modal-title">Delete Group</h2>
          <p className="modal-message">
            Are you sure you want to delete <strong>"{group.name}"</strong>? 
            This action cannot be undone and will permanently remove all messages and data.
          </p>
          
          <div className="confirmation-input">
            <label className="form-label">
              Type the group name <strong>"{group.name}"</strong> to confirm:
            </label>
            <input
              type="text"
              className="form-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={group.name}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn delete-btn" 
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGroupModal;