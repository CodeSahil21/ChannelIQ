import React, { useState } from 'react';
import toast from 'react-hot-toast';
import type { Meeting } from '../../types/meeting.types';

interface MeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  password?: string;
}

const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  meeting, 
  password 
}) => {
  const [copiedField, setCopiedField] = useState<string>('');

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard.');
    }
  };

  const copyAllDetails = async () => {
    const details = `Meeting Details:
Title: ${meeting.title}
Meeting ID: ${meeting.id}
Invite Token: ${meeting.inviteToken}${password ? `\nPassword: ${password}` : ''}
Scheduled: ${new Date(meeting.scheduledAt).toLocaleString()}`;
    
    await copyToClipboard(details, 'all');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content meeting-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Meeting Created Successfully!</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="meeting-details-content">
          <div className="success-icon">✅</div>
          <p className="success-message">Share these details with participants:</p>

          <div className="details-list">
            <div className="detail-item">
              <label>Meeting Title</label>
              <div className="detail-value">
                <span>{meeting.title}</span>
              </div>
            </div>

            <div className="detail-item">
              <label>Meeting ID</label>
              <div className="detail-value">
                <span className="detail-text">{meeting.id}</span>
                <button 
                  onClick={() => copyToClipboard(meeting.id, 'id')}
                  className="copy-btn"
                  title="Copy Meeting ID"
                >
                  {copiedField === 'id' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div className="detail-item">
              <label>Invite Token</label>
              <div className="detail-value">
                <span className="detail-text">{meeting.inviteToken}</span>
                <button 
                  onClick={() => copyToClipboard(meeting.inviteToken, 'token')}
                  className="copy-btn"
                  title="Copy Invite Token"
                >
                  {copiedField === 'token' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {password && (
              <div className="detail-item">
                <label>Meeting Password</label>
                <div className="detail-value">
                  <span className="detail-text">{password}</span>
                  <button 
                    onClick={() => copyToClipboard(password, 'password')}
                    className="copy-btn"
                    title="Copy Password"
                  >
                    {copiedField === 'password' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            )}

            <div className="detail-item">
              <label>Scheduled Time</label>
              <div className="detail-value">
                <span>{new Date(meeting.scheduledAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              onClick={copyAllDetails}
              className="btn-primary copy-all-btn"
            >
              {copiedField === 'all' ? '✓ Copied!' : '📋 Copy All Details'}
            </button>
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>

          <div className="help-text">
            <p><strong>Note:</strong> Participants need the <strong>Invite Token</strong> to join the meeting.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsModal;