import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiUpload, HiTrash, HiCamera } from 'react-icons/hi';
import { Button } from '../ui/Button';
import { PresignedImage } from '../ui/PresignedImage';
import { mediaApi } from '../../api/media.api';
import toast from 'react-hot-toast';

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl?: string | null;
  currentFileName?: string | null;
  onImageUpdate: (fileName: string | null) => void;
}

export const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
  isOpen,
  onClose,
  currentImageUrl,
  currentFileName,
  onImageUpdate
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

    setIsUploading(true);
    try {
      const response = await mediaApi.uploadProfileImage(file);
      
      if (response.data.success && response.data.data) {
        onImageUpdate(response.data.data.fileName);
        toast.success('Profile image updated successfully');
        onClose();
      } else {
        toast.error(response.data.msg || 'Upload failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.msg || 'Failed to upload image';
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!currentFileName) return;

    setIsDeleting(true);
    try {
      const response = await mediaApi.deleteProfileImage(currentFileName);
      
      if (response.data.success) {
        onImageUpdate(null);
        toast.success('Profile image deleted successfully');
        onClose();
      } else {
        toast.error(response.data.msg || 'Delete failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.msg || 'Failed to delete image';
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
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
              <h3>Profile Image</h3>
              <button onClick={onClose} className="modal-close-btn">
                <HiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="current-image-preview">
                {currentFileName ? (
                  <PresignedImage
                    fileName={currentFileName}
                    alt="Current profile"
                    className="current-profile-image"
                    fallback={<div>Loading image...</div>}
                  />
                ) : (
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=default&backgroundColor=2a5298`}
                    alt="Default avatar"
                    className="current-profile-image"
                  />
                )}
              </div>

              <div className="image-actions">
                <Button
                  onClick={handleFileSelect}
                  disabled={isUploading || isDeleting}
                  className="upload-btn"
                >
                  <HiCamera />
                  {isUploading ? 'Uploading...' : currentFileName ? 'Change Image' : 'Upload Image'}
                </Button>

                {currentFileName && (
                  <Button
                    onClick={handleDeleteImage}
                    disabled={isUploading || isDeleting}
                    variant="secondary"
                    className="delete-btn"
                  >
                    <HiTrash />
                    {isDeleting ? 'Deleting...' : 'Remove Image'}
                  </Button>
                )}
              </div>

              <div className="upload-info">
                <p>• Max size: 5MB</p>
                <p>• Formats: JPEG, PNG, WebP</p>
                <p>• Rate limit: 10 uploads per 15 minutes</p>
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