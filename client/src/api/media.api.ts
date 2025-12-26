import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api/media';

const mediaApiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000 // Longer timeout for file uploads
});

export interface MediaUploadResponse {
  success: boolean;
  msg: string;
  data?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    groupId?: string;
    messageType?: 'IMAGE' | 'VIDEO' | 'FILE';
  };
}

export interface MediaDeleteRequest {
  fileName: string;
}

export const mediaApi = {
  uploadProfileImage: (file: File): Promise<{ data: MediaUploadResponse }> => {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    return mediaApiClient.post<MediaUploadResponse>('/upload-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteProfileImage: (fileName: string): Promise<{ data: MediaUploadResponse }> => {
    return mediaApiClient.delete<MediaUploadResponse>('/delete-profile-image', {
      data: { fileName }
    });
  },

  uploadGroupProfileImage: (groupId: string, file: File): Promise<{ data: MediaUploadResponse }> => {
    const formData = new FormData();
    formData.append('groupProfileImage', file);
    
    return mediaApiClient.post<MediaUploadResponse>(`/group-profile-images/${groupId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteGroupProfileImage: (groupId: string, fileName: string): Promise<{ data: MediaUploadResponse }> => {
    return mediaApiClient.delete<MediaUploadResponse>(`/group-profile-images/${groupId}/delete`, {
      data: { fileName }
    });
  },

  uploadMessageFile: (groupId: string, file: File): Promise<{ data: MediaUploadResponse }> => {
    const formData = new FormData();
    formData.append('messageFile', file);
    
    return mediaApiClient.post<MediaUploadResponse>(`/message-files/${groupId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteMessageFile: (groupId: string, fileName: string): Promise<{ data: MediaUploadResponse }> => {
    return mediaApiClient.delete<MediaUploadResponse>(`/message-files/${groupId}/delete`, {
      data: { fileName }
    });
  },

  getFileType: (file: File): 'IMAGE' | 'VIDEO' | 'FILE' => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    return 'FILE';
  }
};