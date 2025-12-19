import React from 'react';
import { HiX } from 'react-icons/hi';

interface LeaveGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  onConfirm: () => void;
}

const LeaveGroupModal: React.FC<LeaveGroupModalProps> = ({ 
  isOpen, 
  onClose, 
  groupName, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Leave Group</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>
        <div className="modal-content">
          <p>Are you sure you want to leave <strong>{groupName}</strong>?</p>
          <p className="warning-text">You will no longer receive messages from this group.</p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn delete-btn" onClick={onConfirm}>
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveGroupModal;