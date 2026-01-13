import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiExclamationCircle, HiX } from 'react-icons/hi';
import { Button } from '../ui/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG, DEFAULT_AXIOS_CONFIG } from '../../config/api';

interface DeleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteProfileModal: React.FC<DeleteProfileModalProps> = ({ isOpen, onClose, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await axios.delete(
        `${API_CONFIG.BASE_URL}/api/users/delete-profile`,
        DEFAULT_AXIOS_CONFIG
      );
      
      toast.success(response.data.message);
      onDeleted();
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error('Profile not found');
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again later');
      } else {
        toast.error('Failed to delete profile');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="delete-modal"
        >
        <div className="modal-header">
          <div className="warning-icon">
            <HiExclamationCircle />
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>
        
        <div className="modal-content">
          <h2 className="modal-title">Delete Profile</h2>
          <p className="modal-message">
            Are you sure you want to delete your profile? This action cannot be undone and will permanently remove all your profile information.
          </p>
        </div>
        
        <div className="modal-actions">
          <Button onClick={onClose} variant="secondary" disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="primary" 
            disabled={isDeleting}
            className="delete-btn"
          >
            {isDeleting ? 'Deleting...' : 'Delete Profile'}
          </Button>
        </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};