import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiUpload, HiTrash, HiCamera, HiUser } from 'react-icons/hi';
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const response = await mediaApi.uploadProfileImage(file);
      
      if (response.data.success && response.data.data) {
        onImageUpdate(response.data.data.fileName);
        setPreviewUrl(null);
        toast.success('Profile image updated successfully');
        onClose();
      } else {
        setPreviewUrl(null);
        toast.error(response.data.msg || 'Upload failed');
      }
    } catch (error: any) {
      setPreviewUrl(null);
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

  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="profile-image-modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.4
            }}
            className="profile-image-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div 
              className="profile-image-modal-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="modal-title-section">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <HiUser className="modal-title-icon" />
                </motion.div>
                <h2 className="modal-title">Profile Image</h2>
              </div>
              <motion.button 
                className="modal-close-button" 
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <HiX />
              </motion.button>
            </motion.div>

            <motion.div 
              className="profile-image-modal-content"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="image-preview-section">
                <motion.div 
                  className="image-preview-container"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {displayImageUrl ? (
                    <motion.img 
                      key={displayImageUrl}
                      src={displayImageUrl} 
                      alt="Profile" 
                      className="preview-image"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : currentFileName ? (
                    <PresignedImage
                      fileName={currentFileName}
                      alt="Current profile"
                      className="preview-image"
                      fallback={
                        <motion.div 
                          className="preview-placeholder"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <div className="placeholder-initials">U</div>
                        </motion.div>
                      }
                    />
                  ) : (
                    <motion.div 
                      className="preview-placeholder"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <div className="placeholder-initials">U</div>
                    </motion.div>
                  )}
                  <motion.div 
                    className="image-overlay"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <HiCamera className="overlay-icon" />
                    </motion.div>
                  </motion.div>
                  {isUploading && (
                    <motion.div 
                      className="upload-progress-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="upload-progress-spinner" />
                    </motion.div>
                  )}
                </motion.div>
              </div>

              <motion.div 
                className="action-buttons-section"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  onClick={handleFileSelect}
                  disabled={isUploading || isDeleting}
                  className="action-button primary"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {isUploading ? (
                    <>
                      <div className="loading-spinner" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <HiUpload />
                      </motion.div>
                      <span>{currentFileName ? 'Change Image' : 'Upload Image'}</span>
                    </>
                  )}
                </motion.button>

                {currentFileName && (
                  <motion.button
                    onClick={handleDeleteImage}
                    disabled={isUploading || isDeleting}
                    className="action-button danger"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {isDeleting ? (
                      <>
                        <div className="loading-spinner" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.3 }}
                        >
                          <HiTrash />
                        </motion.div>
                        <span>Remove Image</span>
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>

              <motion.div 
                className="upload-guidelines"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { label: 'Max size:', value: '5MB' },
                  { label: 'Formats:', value: 'JPEG, PNG, WebP' },
                  { label: 'Rate limit:', value: '10 per 15 min' }
                ].map((item, index) => (
                  <motion.div 
                    key={item.label}
                    className="guideline-item"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <span className="guideline-label">{item.label}</span>
                    <motion.span 
                      className="guideline-value"
                      whileHover={{ scale: 1.05 }}
                    >
                      {item.value}
                    </motion.span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};