import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiCamera, HiTrash } from 'react-icons/hi';
import { Button } from '../ui/Button';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { uploadGroupProfileImage, deleteGroupProfileImage } from '../../store/mediaSlice';
import toast from 'react-hot-toast';

interface GroupImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentImageUrl?: string | null;
  onImageUpdate: (imageUrl: string | null) => void;
}

export const GroupImageModal: React.FC<GroupImageModalProps> = ({
  isOpen,
  onClose,
  groupId,
  currentImageUrl,
  onImageUpdate
}) => {
  const dispatch = useAppDispatch();
  const { uploadingGroup, deletingGroup, error } = useAppSelector(state => state.media);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      const result = await dispatch(uploadGroupProfileImage({ groupId, file })).unwrap();
      onImageUpdate(result.fileUrl);
      toast.success('Group image updated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error || 'Failed to upload image');
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImageUrl) return;

    const fileName = currentImageUrl.split('/').pop();
    if (!fileName) return;

    try {
      await dispatch(deleteGroupProfileImage({ groupId, fileName })).unwrap();
      onImageUpdate(null);
      toast.success('Group image deleted successfully');
      onClose();
    } catch (error: any) {
      toast.error(error || 'Failed to delete image');
    }
  };

  const getInitials = (groupId: string) => {
    return groupId.slice(0, 2).toUpperCase();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-content profile-image-modal"
          >
            <div className="modal-header">
              <h3>Group Image</h3>
              <button onClick={onClose} className="modal-close-btn">
                <HiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="current-image-preview">
                {currentImageUrl ? (
                  <img 
                    src={currentImageUrl} 
                    alt="Group" 
                    className="current-profile-image"
                  />
                ) : (
                  <div className="group-profile-avatar-initials current-profile-image">
                    {getInitials(groupId)}
                  </div>
                )}
              </div>

              <div className="image-actions">
                <Button
                  onClick={handleFileSelect}
                  disabled={uploadingGroup || deletingGroup}
                  className="upload-btn"
                >
                  <HiCamera />
                  {uploadingGroup ? 'Uploading...' : currentImageUrl ? 'Change Image' : 'Upload Image'}
                </Button>

                {currentImageUrl && (
                  <Button
                    onClick={handleDeleteImage}
                    disabled={uploadingGroup || deletingGroup}
                    variant="secondary"
                    className="delete-btn"
                  >
                    <HiTrash />
                    {deletingGroup ? 'Deleting...' : 'Remove Image'}
                  </Button>
                )}
              </div>

              <div className="upload-info">
                <p>• Max size: 5MB</p>
                <p>• Formats: JPEG, PNG, WebP</p>
                <p>• Only group creators can edit</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};