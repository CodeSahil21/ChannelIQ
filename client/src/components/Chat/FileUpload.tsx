import React, { useRef } from 'react';
import { HiPaperClip, HiPhotograph, HiVideoCamera, HiDocument } from 'react-icons/hi';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
  isUploading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  disabled = false,
  className = '',
  isUploading = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={`file-upload-btn ${className} ${isUploading ? 'uploading' : ''}`}
        title={isUploading ? "Uploading..." : "Attach file"}
      >
        {isUploading ? (
          <div className="upload-spinner"></div>
        ) : (
          <HiPaperClip />
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        disabled={disabled || isUploading}
      />
    </>
  );
};

export const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <HiPhotograph />;
  if (mimeType.startsWith('video/')) return <HiVideoCamera />;
  return <HiDocument />;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};