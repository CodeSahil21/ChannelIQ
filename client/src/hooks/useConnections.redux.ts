import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  blockUser,
  unblockUser,
  removeConnection,
  fetchPendingRequests,
  fetchSentRequests,
  fetchConnections,
  fetchBlockedUsers,
  fetchConnectionStats,
  getConnectionStatus,
  clearError
} from '../store/connectionSlice';
import type { SendConnectionRequestRequest } from '../types/connection.types';
import toast from 'react-hot-toast';

export const useConnectionsRedux = () => {
  const dispatch = useAppDispatch();
  const {
    connections,
    pendingRequests,
    sentRequests,
    blockedUsers,
    stats,
    loading,
    error
  } = useAppSelector(state => state.connections);

  const handleSendRequest = useCallback(async (data: SendConnectionRequestRequest) => {
    try {
      await dispatch(sendConnectionRequest(data)).unwrap();
      toast.success('Connection request sent');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    }
  }, [dispatch]);

  const handleAcceptRequest = useCallback(async (connectionId: number) => {
    try {
      await dispatch(acceptConnectionRequest(connectionId)).unwrap();
      toast.success('Request accepted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept request');
    }
  }, [dispatch]);

  const handleDeclineRequest = useCallback(async (connectionId: number) => {
    try {
      await dispatch(declineConnectionRequest(connectionId)).unwrap();
      toast.success('Request declined');
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline request');
    }
  }, [dispatch]);

  const handleBlockUser = useCallback(async (userId: number) => {
    try {
      await dispatch(blockUser(userId)).unwrap();
      toast.success('User blocked');
    } catch (error: any) {
      toast.error(error.message || 'Failed to block user');
    }
  }, [dispatch]);

  const handleUnblockUser = useCallback(async (userId: number) => {
    try {
      await dispatch(unblockUser(userId)).unwrap();
      toast.success('User unblocked');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unblock user');
    }
  }, [dispatch]);

  const handleRemoveConnection = useCallback(async (userId: number) => {
    try {
      await dispatch(removeConnection(userId)).unwrap();
      toast.success('Connection removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove connection');
    }
  }, [dispatch]);

  const loadPendingRequests = useCallback(() => {
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  const loadSentRequests = useCallback(() => {
    dispatch(fetchSentRequests());
  }, [dispatch]);

  const loadConnections = useCallback(() => {
    dispatch(fetchConnections());
  }, [dispatch]);

  const loadBlockedUsers = useCallback(() => {
    dispatch(fetchBlockedUsers());
  }, [dispatch]);

  const loadStats = useCallback(() => {
    dispatch(fetchConnectionStats());
  }, [dispatch]);

  const checkConnectionStatus = useCallback(async (userId: number) => {
    try {
      const result = await dispatch(getConnectionStatus(userId)).unwrap();
      return result;
    } catch (error) {
      return null;
    }
  }, [dispatch]);

  const clearConnectionError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    connections,
    pendingRequests,
    sentRequests,
    blockedUsers,
    stats,
    loading,
    error,
    
    // Actions
    sendRequest: handleSendRequest,
    acceptRequest: handleAcceptRequest,
    declineRequest: handleDeclineRequest,
    blockUser: handleBlockUser,
    unblockUser: handleUnblockUser,
    removeConnection: handleRemoveConnection,
    
    // Fetch actions
    fetchPendingRequests: loadPendingRequests,
    fetchSentRequests: loadSentRequests,
    fetchConnections: loadConnections,
    fetchBlockedUsers: loadBlockedUsers,
    fetchStats: loadStats,
    getConnectionStatus: checkConnectionStatus,
    
    // Utility
    clearError: clearConnectionError,
  };
};