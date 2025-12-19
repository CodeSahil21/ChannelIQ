import React from 'react';
import { HiX } from 'react-icons/hi';

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  onConfirm: () => void;
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  memberName, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Remove Member</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>
        <div className="modal-content">
          <p>Are you sure you want to remove <strong>{memberName}</strong> from this group?</p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn delete-btn" onClick={onConfirm}>
            Remove Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveMemberModal;