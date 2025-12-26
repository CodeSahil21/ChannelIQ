import { useState } from 'react';
import { mediaApi } from '../api/media.api';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  fileUrl?: string;
  messageType?: 'IMAGE' | 'VIDEO' | 'FILE';
  error?: string;
}

export const useFileUpload = () => {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const uploadFile = async (groupId: string, file: File): Promise<{ fileUrl: string; messageType: 'IMAGE' | 'VIDEO' | 'FILE' } | null> => {
    const uploadId = `${Date.now()}-${file.name}`;
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploads(prev => new Map(prev.set(uploadId, {
        file,
        progress: 0,
        status: 'error',
        error: 'File size must be less than 10MB'
      })));
      return null;
    }

    setUploads(prev => new Map(prev.set(uploadId, {
      file,
      progress: 0,
      status: 'uploading'
    })));

    try {
      const response = await mediaApi.uploadMessageFile(groupId, file);
      
      if (response.data.success && response.data.data) {
        const { fileUrl, messageType } = response.data.data;
        
        setUploads(prev => new Map(prev.set(uploadId, {
          file,
          progress: 100,
          status: 'completed',
          fileUrl,
          messageType: messageType || mediaApi.getFileType(file)
        })));

        return {
          fileUrl,
          messageType: messageType || mediaApi.getFileType(file)
        };
      }
      
      throw new Error(response.data.msg || 'Upload failed');
    } catch (error: any) {
      setUploads(prev => new Map(prev.set(uploadId, {
        file,
        progress: 0,
        status: 'error',
        error: error.message || 'Upload failed'
      })));
      return null;
    }
  };

  const clearUpload = (uploadId: string) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.delete(uploadId);
      return newMap;
    });
  };

  const clearAllUploads = () => {
    setUploads(new Map());
  };

  return {
    uploads: Array.from(uploads.entries()),
    uploadFile,
    clearUpload,
    clearAllUploads
  };
};