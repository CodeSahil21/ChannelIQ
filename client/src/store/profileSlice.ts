import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../api/user.api';
import axios from 'axios';
import { API_CONFIG, DEFAULT_AXIOS_CONFIG } from '../config/api';
import type { 
  UserProfileResponse, 
  CreateProfileFormData, 
  UpdatePreferencesData,
  UserPreference,
  UserSearchResult 
} from '../types';

interface ProfileState {
  profile: UserProfileResponse | null;
  preferences: UserPreference | null;
  searchResults: UserSearchResult[];
  loading: boolean;
  saving: boolean;
  searching: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  preferences: null,
  searchResults: [],
  loading: false,
  saving: false,
  searching: false,
  error: null,
};

// Create axios instance for profile operations
const profileApi = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api/users`,
  ...DEFAULT_AXIOS_CONFIG,
  timeout: API_CONFIG.TIMEOUT.USER_API
});

// Async thunks
export const createUserProfile = createAsyncThunk(
  'profile/createProfile',
  async (profileData: CreateProfileFormData, { rejectWithValue }) => {
    try {
    const cleanedData: Partial<CreateProfileFormData> = {
      fullName: profileData.fullName.trim()
    };

    // Only include non-empty fields
    Object.entries(profileData).forEach(([key, value]) => {
      if (key !== 'fullName' && value) {
        if (typeof value === 'string' && value.trim()) {
          (cleanedData as any)[key] = value.trim();
        } else if (Array.isArray(value) && value.length > 0) {
          (cleanedData as any)[key] = value;
        } else if (typeof value === 'number') {
          (cleanedData as any)[key] = value;
        }
      }
    });

      const response = await profileApi.post('/create-profile', cleanedData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profileData: Partial<CreateProfileFormData>, { rejectWithValue }) => {
    try {
    const cleanedData: Partial<CreateProfileFormData> = {};

    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' && value.trim()) {
          (cleanedData as any)[key] = value.trim();
        } else if (Array.isArray(value) && value.length > 0) {
          (cleanedData as any)[key] = value;
        } else if (typeof value === 'number') {
          (cleanedData as any)[key] = value;
        }
      }
    });

      const response = await profileApi.put('/update-profile', cleanedData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId: number | undefined, { rejectWithValue }) => {
    try {
      const endpoint = userId ? `/fetch-profile/${userId}` : '/get-profile';
      const response = await profileApi.get(endpoint);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'profile/searchUsers',
  async ({ query, limit = 10 }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await userApi.searchUsers(query, limit);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchUserPreferences = createAsyncThunk(
  'profile/fetchPreferences',
  async () => {
    const response = await profileApi.get('/preferences');
    return response.data.data;
  }
);

export const updateUserPreferences = createAsyncThunk(
  'profile/updatePreferences',
  async (preferences: UpdatePreferencesData, { rejectWithValue }) => {
    try {
      const dataToSend = {
        ...preferences,
        theme: preferences.theme?.toUpperCase()
      };
      const response = await profileApi.put('/preferences', dataToSend);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update preferences');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    updateProfileImage: (state, action) => {
      if (state.profile) {
        state.profile.profilePic = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create profile
      .addCase(createUserProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createUserProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
      })
      .addCase(createUserProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to create profile';
      })

      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to update profile';
      })

      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch profile';
      })

      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.searching = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searching = false;
        state.error = (action.payload as string) || action.error.message || 'Search failed';
      })

      // Fetch preferences
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })

      // Update preferences
      .addCase(updateUserPreferences.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.saving = false;
        state.preferences = action.payload;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to update preferences';
      });
  },
});

export const { clearError, clearSearchResults, updateProfileImage } = profileSlice.actions;
export default profileSlice.reducer;