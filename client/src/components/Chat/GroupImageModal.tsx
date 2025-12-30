import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiCamera, HiTrash, HiUpload, HiPhotograph } from 'react-icons/hi';
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
  const { uploadingGroup, deletingGroup } = useAppSelector(state => state.media);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    try {
      const result = await dispatch(uploadGroupProfileImage({ groupId, file })).unwrap();
      const newImageUrl = `${result.fileUrl}?t=${Date.now()}`; // Cache busting
      onImageUpdate(newImageUrl);
      setPreviewUrl(null);
      toast.success('Group image updated successfully');
      onClose();
    } catch (error: any) {
      setPreviewUrl(null);
      toast.error(error || 'Failed to upload image');
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImageUrl) return;

    const fileName = currentImageUrl.split('/').pop()?.split('?')[0];
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

  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="group-image-modal-overlay"
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
            className="group-image-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div 
              className="group-image-modal-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="modal-title-section">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <HiPhotograph className="modal-title-icon" />
                </motion.div>
                <h2 className="modal-title">Group Image</h2>
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
              className="group-image-modal-content"
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
                      alt="Group" 
                      className="preview-image"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <motion.div 
                      className="preview-placeholder"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <div className="placeholder-initials">
                        {getInitials(groupId)}
                      </div>
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
                  {uploadingGroup && (
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
                  disabled={uploadingGroup || deletingGroup}
                  className="action-button primary"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {uploadingGroup ? (
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
                      <span>{currentImageUrl ? 'Change Image' : 'Upload Image'}</span>
                    </>
                  )}
                </motion.button>

                {currentImageUrl && (
                  <motion.button
                    onClick={handleDeleteImage}
                    disabled={uploadingGroup || deletingGroup}
                    className="action-button danger"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {deletingGroup ? (
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
                  { label: 'Access:', value: 'Group creators only' }
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