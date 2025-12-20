import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { RootState } from '../store';
import { useAppDispatch } from './useAppDispatch';
import { 
  createGroup, 
  getMyGroups, 
  searchGroups, 
  getPendingRequests,
  joinGroup,
  respondToRequest,
  updateGroup,
  deleteGroup,
  inviteUser,
  leaveGroup,
  getGroupDetails,
  updateMemberRole,
  updateMemberSettings,
  clearError,
  clearSearchResults,
  setCurrentGroup,
  updateGroupImage,
  updateGroupDetails,
  updateMemberCount
} from '../store/groupSlice';
import type { CreateGroupRequest, UpdateGroupRequest } from '../types/group.types';

export const useGroups = () => {
  const dispatch = useAppDispatch();
  const { 
    groups, 
    currentGroup, 
    pendingRequests, 
    searchResults, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.groups);

  const handleCreateGroup = useCallback(async (groupData: CreateGroupRequest) => {
    const result = await dispatch(createGroup(groupData));
    if (createGroup.fulfilled.match(result)) {
      // Refresh groups list after creating
      dispatch(getMyGroups());
      return true;
    }
    return false;
  }, [dispatch]);

  const handleGetMyGroups = useCallback(() => {
    dispatch(getMyGroups());
  }, [dispatch]);

  const handleSearchGroups = useCallback((searchTerm: string) => {
    if (searchTerm.trim().length >= 2) {
      dispatch(searchGroups(searchTerm));
    } else {
      dispatch(clearSearchResults());
    }
  }, [dispatch]);

  const handleGetPendingRequests = useCallback(() => {
    dispatch(getPendingRequests());
  }, [dispatch]);

  const handleJoinGroup = useCallback(async (groupId: string, message?: string) => {
    const result = await dispatch(joinGroup({ groupId, message }));
    if (joinGroup.fulfilled.match(result)) {
      // Refresh groups and pending requests
      dispatch(getMyGroups());
      dispatch(getPendingRequests());
      return true;
    }
    return false;
  }, [dispatch]);

  const handleRespondToRequest = useCallback(async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const result = await dispatch(respondToRequest({ requestId, status }));
    if (respondToRequest.fulfilled.match(result)) {
      // Refresh groups and pending requests
      dispatch(getMyGroups());
      dispatch(getPendingRequests());
      return true;
    }
    return false;
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleClearSearchResults = useCallback(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  const handleUpdateGroup = useCallback(async (groupId: string, data: UpdateGroupRequest) => {
    const result = await dispatch(updateGroup({ groupId, data }));
    if (updateGroup.fulfilled.match(result)) {
      // Refetch to sync with backend cache invalidation
      dispatch(getMyGroups());
      dispatch(getGroupDetails(groupId));
      return true;
    }
    return false;
  }, [dispatch]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    const result = await dispatch(deleteGroup(groupId));
    if (deleteGroup.fulfilled.match(result)) {
      // Refetch to sync with backend cache invalidation
      dispatch(getMyGroups());
      return true;
    }
    return false;
  }, [dispatch]);

  const handleInviteUser = useCallback(async (groupId: string, targetUserId: number, message?: string) => {
    const result = await dispatch(inviteUser({ groupId, targetUserId, message }));
    if (inviteUser.fulfilled.match(result)) {
      dispatch(getPendingRequests());
      return true;
    }
    return false;
  }, [dispatch]);

  const handleLeaveGroup = useCallback(async (groupId: string, userId: number) => {
    const result = await dispatch(leaveGroup({ groupId, userId }));
    if (leaveGroup.fulfilled.match(result)) {
      // Refetch to sync with backend cache invalidation
      dispatch(getMyGroups());
      return true;
    }
    return false;
  }, [dispatch]);

  const handleGetGroupDetails = useCallback(async (groupId: string) => {
    const result = await dispatch(getGroupDetails(groupId));
    return getGroupDetails.fulfilled.match(result);
  }, [dispatch]);



  const handleUpdateMemberRole = useCallback(async (groupId: string, userId: number, role: 'ADMIN' | 'CO_ADMIN' | 'MEMBER') => {
    const result = await dispatch(updateMemberRole({ groupId, userId, role }));
    if (updateMemberRole.fulfilled.match(result)) {
      // Refetch to sync with backend cache invalidation
      dispatch(getGroupDetails(groupId));
      return true;
    }
    return false;
  }, [dispatch]);

  const handleUpdateMemberSettings = useCallback(async (groupId: string, isMuted?: boolean, muteUntil?: string | null) => {
    const result = await dispatch(updateMemberSettings({ groupId, isMuted, muteUntil }));
    return updateMemberSettings.fulfilled.match(result);
  }, [dispatch]);

  const handleSetCurrentGroup = useCallback((group: any) => {
    dispatch(setCurrentGroup(group));
  }, [dispatch]);

  const handleImageUpdate = useCallback(async (groupId: string, imageUrl: string | null) => {
    // Optimistic update first
    dispatch(updateGroupImage({ groupId, imageUrl }));
    // Then refetch to ensure sync with backend
    setTimeout(() => {
      dispatch(getMyGroups());
      dispatch(getGroupDetails(groupId));
    }, 500);
  }, [dispatch]);

  const handleGroupDetailsUpdate = useCallback((groupId: string, updates: any) => {
    dispatch(updateGroupDetails({ groupId, updates }));
  }, [dispatch]);

  const handleMemberCountUpdate = useCallback((groupId: string, count: number) => {
    dispatch(updateMemberCount({ groupId, count }));
  }, [dispatch]);

  const handleRealTimeGroupUpdate = useCallback((groupId: string, updates: any) => {
    // For real-time updates from other users
    dispatch(updateGroupDetails({ groupId, updates }));
    // If it's the current group, also update current group state
    if (updates.currentGroup?.id === groupId) {
      dispatch(setCurrentGroup({ ...updates.currentGroup, ...updates }));
    }
  }, [dispatch]);

  return {
    // State
    groups,
    currentGroup,
    pendingRequests,
    searchResults,
    loading,
    error,
    
    // Actions
    createGroup: handleCreateGroup,
    getMyGroups: handleGetMyGroups,
    searchGroups: handleSearchGroups,
    getPendingRequests: handleGetPendingRequests,
    joinGroup: handleJoinGroup,
    respondToRequest: handleRespondToRequest,
    updateGroup: handleUpdateGroup,
    deleteGroup: handleDeleteGroup,
    inviteUser: handleInviteUser,
    leaveGroup: handleLeaveGroup,
    getGroupDetails: handleGetGroupDetails,
    updateMemberRole: handleUpdateMemberRole,
    updateMemberSettings: handleUpdateMemberSettings,
    clearError: handleClearError,
    clearSearchResults: handleClearSearchResults,
    setCurrentGroup: handleSetCurrentGroup,
    handleImageUpdate,
    handleGroupDetailsUpdate,
    handleMemberCountUpdate,
    handleRealTimeGroupUpdate,
  };
};