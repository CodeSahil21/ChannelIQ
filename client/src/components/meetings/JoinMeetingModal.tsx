import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinMeetingModal: React.FC<JoinMeetingModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingId.trim()) {
      navigate(`/meeting/${meetingId.trim()}`);
      onClose();
      setMeetingId('');
    }
  };

  const handleClose = () => {
    setMeetingId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Join Meeting</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="meetingId">Meeting ID</label>
            <input
              type="text"
              id="meetingId"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Enter meeting ID"
              required
              autoFocus
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Join Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinMeetingModal;