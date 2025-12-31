import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createMeeting } from '../../store/meetingSlice';
import type { Meeting } from '../../types/meeting.types';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (meetingId: string) => void;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    passwordEnabled: false,
    password: '',
    inviteExpiresAt: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const meetingData = {
        title: formData.title,
        description: formData.description || undefined,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        passwordEnabled: formData.passwordEnabled,
        password: formData.passwordEnabled ? formData.password : undefined,
        inviteExpiresAt: formData.inviteExpiresAt ? new Date(formData.inviteExpiresAt).toISOString() : undefined
      };

      const result = await dispatch(createMeeting(meetingData)).unwrap();
      
      downloadMeetingDetails(result, formData.passwordEnabled ? formData.password : undefined);
      
      onSuccess?.(result.id);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadMeetingDetails = (meeting: Meeting, password?: string) => {
    const details = `MEETING DETAILS
================

Title: ${meeting.title}
Description: ${meeting.description || 'No description'}
Meeting ID: ${meeting.id}
Invite Token: ${meeting.inviteToken}${password ? `\nPassword: ${password}` : ''}
Scheduled: ${new Date(meeting.scheduledAt).toLocaleString()}
Status: ${meeting.status}
Password Protected: ${meeting.passwordEnabled ? 'Yes' : 'No'}

IMPORTANT NOTES:
- Share the INVITE TOKEN with participants to join
- Meeting ID is for reference only
- Keep these details secure

Generated: ${new Date().toLocaleString()}`;

    const blob = new Blob([details], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-${meeting.title.replace(/[^a-zA-Z0-9]/g, '-')}-${meeting.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduledAt: '',
      passwordEnabled: false,
      password: '',
      inviteExpiresAt: ''
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Meeting</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label htmlFor="title">Meeting Title *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter meeting title"
              maxLength={200}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Meeting description (optional)"
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduledAt">Scheduled Date & Time *</label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={e => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.passwordEnabled}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  passwordEnabled: e.target.checked,
                  password: e.target.checked ? prev.password : ''
                }))}
              />
              <span>Password protect this meeting</span>
            </label>
          </div>

          {formData.passwordEnabled && (
            <div className="form-group">
              <label htmlFor="password">Meeting Password *</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter meeting password"
                minLength={4}
                maxLength={50}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="inviteExpiresAt">Invite Expiration (Optional)</label>
            <input
              id="inviteExpiresAt"
              type="datetime-local"
              value={formData.inviteExpiresAt}
              onChange={e => setFormData(prev => ({ ...prev, inviteExpiresAt: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;