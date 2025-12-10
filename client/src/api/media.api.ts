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
  }
};