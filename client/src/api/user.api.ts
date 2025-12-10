import axios from 'axios';
import { apiCache } from '../utils/apiCache';
import type { ApiResponse, UserSearchResult, UserProfileResponse } from '../types';

const BASE_URL = 'http://localhost:4000/api/users';

const userApiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 8000
});

// Add caching for GET requests
userApiClient.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const cacheKey = `${config.url}_${JSON.stringify(config.params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return Promise.reject({ cached: true, data: cached });
    }
  }
  return config;
});

userApiClient.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}_${JSON.stringify(response.config.params)}`;
      apiCache.set(cacheKey, response.data, 2 * 60 * 1000); // 2 minutes cache
    }
    return response;
  },
  (error) => {
    if (error.cached) {
      return Promise.resolve({ data: error.data });
    }
    return Promise.reject(error);
  }
);

export const userApi = {
  searchUsers: (query: string, limit: number = 10) =>
    userApiClient.get<ApiResponse<UserSearchResult[]>>('/search', {
      params: { query, limit }
    }),

  fetchUserProfile: (userId: number) =>
    userApiClient.get<ApiResponse<UserProfileResponse>>(`/fetch-profile/${userId}`),
};
