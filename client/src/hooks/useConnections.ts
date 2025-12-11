import { useState, useCallback, useMemo } from 'react';
import { connectionApi } from '../api/connection.api';
import toast from 'react-hot-toast';
import type { ConnectionResponse, ConnectionStatsResponse, ConnectionStatusString, SendConnectionRequestRequest, ConnectedUser } from '../types/connection.types';

export const useConnections = () => {
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<ConnectionResponse[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionResponse[]>([]);
  const [connections, setConnections] = useState<ConnectedUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<ConnectionResponse[]>([]);
  const [stats, setStats] = useState<ConnectionStatsResponse | null>(null);

  const sendRequest = useCallback(async (data: SendConnectionRequestRequest) => {
    setLoading(true);
    try {
      const res = await connectionApi.sendRequest(data);
      if (res.data.success) {
        toast.success(res.data.message || 'Connection request sent');
        return res.data.data;
      }
      toast.error(res.data.message || 'Failed to send request');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error sending request');
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptRequest = useCallback(async (connectionId: number) => {
    setLoading(true);
    try {
      const res = await connectionApi.acceptRequest(connectionId);
      if (res.data.success) {
        toast.success(res.data.message || 'Request accepted');
        setPendingRequests(prev => prev.filter(r => r.id !== connectionId));
        return res.data.data;
      }
      toast.error(res.data.message || 'Failed to accept');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error accepting request');
    } finally {
      setLoading(false);
    }
  }, []);

  const declineRequest = useCallback(async (connectionId: number) => {
    setLoading(true);
    try {
      const res = await connectionApi.declineRequest(connectionId);
      if (res.data.success) {
        toast.success(res.data.message || 'Request declined');
        setPendingRequests(prev => prev.filter(r => r.id !== connectionId));
        return res.data.data;
      }
      toast.error(res.data.message || 'Failed to decline');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error declining request');
    } finally {
      setLoading(false);
    }
  }, []);

  const blockUser = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const res = await connectionApi.blockUser(userId);
      if (res.data.success) {
        toast.success(res.data.message || 'User blocked');
        return true;
      }
      toast.error(res.data.message || 'Failed to block');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error blocking user');
    } finally {
      setLoading(false);
    }
  }, []);

  const unblockUser = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const res = await connectionApi.unblockUser(userId);
      if (res.data.success) {
        toast.success(res.data.message || 'User unblocked');
        setBlockedUsers(prev => prev.filter(u => u.receiver?.id !== userId && u.sender?.id !== userId));
        return true;
      }
      toast.error(res.data.message || 'Failed to unblock');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error unblocking user');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeConnection = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const res = await connectionApi.removeConnection(userId);
      if (res.data.success) {
        toast.success(res.data.message || 'Connection removed');
        setConnections(prev => prev.filter(c => c.id !== userId));
        return true;
      }
      toast.error(res.data.message || 'Failed to remove');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error removing connection');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    if (loading) return; // Prevent duplicate requests
    setLoading(true);
    try {
      const res = await connectionApi.getPendingRequests();
      if (res.data.success) {
        setPendingRequests(res.data.data || []);
      }
    } catch (error: any) {
      toast.error('Error fetching pending requests');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const fetchSentRequests = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await connectionApi.getSentRequests();
      if (res.data.success) {
        setSentRequests(res.data.data || []);
      }
    } catch (error: any) {
      toast.error('Error fetching sent requests');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const fetchConnections = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await connectionApi.getConnectedUsers();
      if (res.data.success) {
        setConnections(res.data.data || []);
      }
    } catch (error: any) {
      toast.error('Error fetching connections');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const fetchBlockedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await connectionApi.getBlockedUsers();
      if (res.data.success) {
        setBlockedUsers(res.data.data || []);
      }
    } catch (error: any) {
      toast.error('Error fetching blocked users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await connectionApi.getStats();
      if (res.data.success) {
        setStats(res.data.data || null);
      }
    } catch (error: any) {
      console.error('Error fetching stats');
    }
  }, []);

  const getConnectionStatus = useCallback(async (userId: number): Promise<ConnectionStatusString | null> => {
    try {
      const res = await connectionApi.getConnectionStatus(userId);
      if (res.data.success) {
        return res.data.data?.status || null;
      }
    } catch (error: any) {
      console.error('Error fetching status');
    }
    return null;
  }, []);

  // Memoize computed values
  const memoizedStats = useMemo(() => stats, [stats]);
  const memoizedConnections = useMemo(() => connections, [connections]);
  
  return {
    loading,
    pendingRequests,
    sentRequests,
    connections: memoizedConnections,
    blockedUsers,
    stats: memoizedStats,
    sendRequest,
    acceptRequest,
    declineRequest,
    blockUser,
    unblockUser,
    removeConnection,
    fetchPendingRequests,
    fetchSentRequests,
    fetchConnections,
    fetchBlockedUsers,
    fetchStats,
    getConnectionStatus,
  };
};
