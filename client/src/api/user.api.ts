import axios from 'axios';
import type { ApiResponse, UserSearchResult, UserProfileResponse } from '../types';

const BASE_URL = 'http://localhost:4000/api/users';

export const userApi = {
  searchUsers: (query: string, limit: number = 10) =>
    axios.get<ApiResponse<UserSearchResult[]>>(`${BASE_URL}/search`, {
      params: { query, limit },
      withCredentials: true,
    }),

  fetchUserProfile: (userId: number) =>
    axios.get<ApiResponse<UserProfileResponse>>(`${BASE_URL}/fetch-profile/${userId}`, {
      withCredentials: true,
    }),
};
