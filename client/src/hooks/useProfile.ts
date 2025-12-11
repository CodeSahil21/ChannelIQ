import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  createUserProfile,
  updateUserProfile,
  fetchUserProfile,
  searchUsers,
  fetchUserPreferences,
  updateUserPreferences,
  clearError,
  clearSearchResults,
  updateProfileImage
} from '../store/profileSlice';
import { uploadProfileImage, deleteProfileImage } from '../store/mediaSlice';
import type { CreateProfileFormData, UpdatePreferencesData } from '../types';
import toast from 'react-hot-toast';

export const useProfile = () => {
  const dispatch = useAppDispatch();
  const profileState = useAppSelector(state => state.profile);
  const mediaState = useAppSelector(state => state.media);

  const handleCreateProfile = useCallback(async (profileData: CreateProfileFormData) => {
    try {
      await dispatch(createUserProfile(profileData)).unwrap();
      toast.success('Profile created successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
      return false;
    }
  }, [dispatch]);

  const handleUpdateProfile = useCallback(async (profileData: Partial<CreateProfileFormData>) => {
    try {
      await dispatch(updateUserProfile(profileData)).unwrap();
      toast.success('Profile updated successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      return false;
    }
  }, [dispatch]);

  const handleFetchProfile = useCallback((userId?: number) => {
    dispatch(fetchUserProfile(userId));
  }, [dispatch]);

  const handleSearchUsers = useCallback(async (query: string, limit?: number) => {
    if (query.trim().length < 2) {
      dispatch(clearSearchResults());
      return;
    }
    dispatch(searchUsers({ query, limit }));
  }, [dispatch]);

  const handleFetchPreferences = useCallback(() => {
    dispatch(fetchUserPreferences());
  }, [dispatch]);

  const handleUpdatePreferences = useCallback(async (preferences: UpdatePreferencesData) => {
    try {
      await dispatch(updateUserPreferences(preferences)).unwrap();
      toast.success('Preferences updated successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update preferences');
      return false;
    }
  }, [dispatch]);

  const handleUploadImage = useCallback(async (file: File) => {
    try {
      const result = await dispatch(uploadProfileImage(file)).unwrap();
      if (result) {
        dispatch(updateProfileImage(result.fileUrl));
        toast.success('Profile image updated successfully');
        return result;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
      throw error;
    }
  }, [dispatch]);

  const handleDeleteImage = useCallback(async (fileName: string) => {
    try {
      await dispatch(deleteProfileImage(fileName)).unwrap();
      dispatch(updateProfileImage(null));
      toast.success('Profile image deleted successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete image');
      return false;
    }
  }, [dispatch]);

  const clearProfileError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearSearch = useCallback(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  // Auto-fetch preferences on mount
  useEffect(() => {
    if (!profileState.preferences) {
      handleFetchPreferences();
    }
  }, [profileState.preferences, handleFetchPreferences]);

  return {
    // Profile state
    profile: profileState.profile,
    preferences: profileState.preferences,
    searchResults: profileState.searchResults,
    loading: profileState.loading,
    saving: profileState.saving,
    searching: profileState.searching,
    error: profileState.error,

    // Media state
    uploading: mediaState.uploading,
    deleting: mediaState.deleting,
    mediaError: mediaState.error,
    lastUploadedImage: mediaState.lastUploadedImage,

    // Profile actions
    createProfile: handleCreateProfile,
    updateProfile: handleUpdateProfile,
    fetchProfile: handleFetchProfile,
    searchUsers: handleSearchUsers,
    
    // Preferences actions
    fetchPreferences: handleFetchPreferences,
    updatePreferences: handleUpdatePreferences,

    // Media actions
    uploadImage: handleUploadImage,
    deleteImage: handleDeleteImage,

    // Utility actions
    clearError: clearProfileError,
    clearSearchResults: clearSearch,
  };
};