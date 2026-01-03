import React from 'react';
import styles from './RemoveParticipantModal.module.css';

interface RemoveParticipantModalProps {
  isOpen: boolean;
  participantName: string;
  participantEmail: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const RemoveParticipantModal: React.FC<RemoveParticipantModalProps> = ({
  isOpen,
  participantName,
  participantEmail,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Remove Participant</h3>
          <button className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.warningIcon}>⚠️</div>
          <p>Are you sure you want to remove this participant from the meeting?</p>
          
          <div className={styles.participantInfo}>
            <div className={styles.avatar}>
              {participantName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className={styles.details}>
              <div className={styles.name}>{participantName || 'Unknown User'}</div>
              <div className={styles.email}>{participantEmail}</div>
            </div>
          </div>
          
          <div className={styles.warning}>
            <span>This action cannot be undone. The participant will be immediately removed from the meeting.</span>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Remove Participant
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveParticipantModal;