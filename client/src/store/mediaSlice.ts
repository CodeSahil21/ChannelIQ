import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mediaApi } from '../api/media.api';

interface MediaState {
  uploading: boolean;
  deleting: boolean;
  uploadingGroup: boolean;
  deletingGroup: boolean;
  error: string | null;
  lastUploadedImage: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  } | null;
  lastUploadedGroupImage: {
    groupId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  } | null;
}

const initialState: MediaState = {
  uploading: false,
  deleting: false,
  uploadingGroup: false,
  deletingGroup: false,
  error: null,
  lastUploadedImage: null,
  lastUploadedGroupImage: null,
};

// Async thunks
export const uploadProfileImage = createAsyncThunk(
  'media/uploadProfileImage',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await mediaApi.uploadProfileImage(file);
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.msg || 'Failed to upload image');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Failed to upload image');
    }
  }
);

export const deleteProfileImage = createAsyncThunk(
  'media/deleteProfileImage',
  async (fileName: string, { rejectWithValue }) => {
    try {
      const response = await mediaApi.deleteProfileImage(fileName);
      if (response.data.success) {
        return fileName;
      } else {
        return rejectWithValue(response.data.msg || 'Failed to delete image');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Failed to delete image');
    }
  }
);

export const uploadGroupProfileImage = createAsyncThunk(
  'media/uploadGroupProfileImage',
  async ({ groupId, file }: { groupId: string; file: File }, { rejectWithValue }) => {
    try {
      const response = await mediaApi.uploadGroupProfileImage(groupId, file);
      if (response.data.success && response.data.data) {
        return { groupId, ...response.data.data };
      } else {
        return rejectWithValue(response.data.msg || 'Failed to upload group image');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Failed to upload group image');
    }
  }
);

export const deleteGroupProfileImage = createAsyncThunk(
  'media/deleteGroupProfileImage',
  async ({ groupId, fileName }: { groupId: string; fileName: string }, { rejectWithValue }) => {
    try {
      const response = await mediaApi.deleteGroupProfileImage(groupId, fileName);
      if (response.data.success) {
        return groupId;
      } else {
        return rejectWithValue(response.data.msg || 'Failed to delete group image');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Failed to delete group image');
    }
  }
);

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLastUpload: (state) => {
      state.lastUploadedImage = null;
    },
    clearLastGroupUpload: (state) => {
      state.lastUploadedGroupImage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload profile image
      .addCase(uploadProfileImage.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.uploading = false;
        state.lastUploadedImage = action.payload || null;
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.uploading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to upload image';
      })

      // Delete profile image
      .addCase(deleteProfileImage.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteProfileImage.fulfilled, (state) => {
        state.deleting = false;
        state.lastUploadedImage = null;
      })
      .addCase(deleteProfileImage.rejected, (state, action) => {
        state.deleting = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to delete image';
      })

      // Upload group profile image
      .addCase(uploadGroupProfileImage.pending, (state) => {
        state.uploadingGroup = true;
        state.error = null;
      })
      .addCase(uploadGroupProfileImage.fulfilled, (state, action) => {
        state.uploadingGroup = false;
        state.lastUploadedGroupImage = action.payload || null;
      })
      .addCase(uploadGroupProfileImage.rejected, (state, action) => {
        state.uploadingGroup = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to upload group image';
      })

      // Delete group profile image
      .addCase(deleteGroupProfileImage.pending, (state) => {
        state.deletingGroup = true;
        state.error = null;
      })
      .addCase(deleteGroupProfileImage.fulfilled, (state) => {
        state.deletingGroup = false;
        state.lastUploadedGroupImage = null;
      })
      .addCase(deleteGroupProfileImage.rejected, (state, action) => {
        state.deletingGroup = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to delete group image';
      });
  },
});

export const { clearError, clearLastUpload, clearLastGroupUpload } = mediaSlice.actions;
export default mediaSlice.reducer;