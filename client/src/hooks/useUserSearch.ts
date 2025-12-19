import { useState, useCallback } from 'react';
import { userApi } from '../api/user.api';
import type { UserSearchResult } from '../types';

export const useUserSearch = () => {
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (query: string, limit: number = 10) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await userApi.searchUsers(query, limit);
      if (response.data.success) {
        setSearchResults(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to search users');
        setSearchResults([]);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to search users');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    loading,
    error,
    searchUsers,
    clearResults,
  };
};