import React, { useState } from 'react';
import { HiX, HiPlus, HiTrash } from 'react-icons/hi';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { createPoll } from '../../store/groupContentSlice';
import type { CreatePollRequest } from '../../types';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onPollCreated?: () => void;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({ 
  isOpen, 
  onClose, 
  groupId,
  onPollCreated
}) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.groupContent.polls);
  
  const [formData, setFormData] = useState<CreatePollRequest>({
    question: '',
    options: ['', ''],
    allowMultiple: false,
    expiresAt: undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || formData.options.some(opt => !opt.trim())) {
      return;
    }

    const pollData = {
      ...formData,
      question: formData.question.trim(),
      options: formData.options.filter(opt => opt.trim()).map(opt => opt.trim()),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined
    };

    try {
      await dispatch(createPoll({ groupId, pollData })).unwrap();
      onPollCreated?.();
      onClose();
      setFormData({
        question: '',
        options: ['', ''],
        allowMultiple: false,
        expiresAt: undefined
      });
    } catch (error) {
      toast.error('Failed to create poll. Please try again.');
    }
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData({ ...formData, options: [...formData.options, ''] });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-group-modal">
        <div className="modal-header">
          <h2>Create Poll</h2>
          <button onClick={onClose} className="modal-close-btn">
            <HiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-group-form">
          <div className="form-group">
            <label className="form-label">Question *</label>
            <input
              type="text"
              className="form-input"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Enter poll question"
              maxLength={200}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Options *</label>
            <div className="poll-options-container">
              <div className="poll-options-header">
                <span className="poll-options-title">Poll Options</span>
                <span className="poll-options-count">{formData.options.length}/10</span>
              </div>
              {formData.options.map((option, index) => (
                <div key={index} className="poll-option-row">
                  <input
                    type="text"
                    className="poll-option-input"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    maxLength={100}
                    required
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="poll-remove-btn"
                      title="Remove option"
                    >
                      <HiTrash />
                    </button>
                  )}
                </div>
              ))}
              {formData.options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="poll-add-option-btn"
                >
                  <HiPlus /> Add Option
                </button>
              )}
            </div>
          </div>

          <div className="poll-checkbox-container">
            <label className="poll-checkbox-label">
              <input
                type="checkbox"
                className="poll-checkbox"
                checked={formData.allowMultiple}
                onChange={(e) => setFormData({ ...formData, allowMultiple: e.target.checked })}
              />
              <span className="poll-checkbox-text">Allow multiple selections</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Expires At (Optional)</label>
            <input
              type="datetime-local"
              className="form-input"
              value={formData.expiresAt || ''}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value || undefined })}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { CreatePollModal };
export default CreatePollModal;