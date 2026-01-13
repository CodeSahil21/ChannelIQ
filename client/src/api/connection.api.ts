import axios from 'axios';
import { apiCache } from '../utils/apiCache';
import { API_CONFIG, DEFAULT_AXIOS_CONFIG } from '../config/api';
import type {
  SendConnectionRequestRequest,
  SendConnectionApiResponse,
  AcceptConnectionApiResponse,
  DeclineConnectionApiResponse,
  BlockUserApiResponse,
  UnblockUserApiResponse,
  RemoveConnectionApiResponse,
  PendingRequestsApiResponse,
  SentRequestsApiResponse,
  ConnectionsListApiResponse,
  BlockedUsersApiResponse,
  ConnectionStatusApiResponse,
  ConnectionStatsApiResponse,
  ConnectedUsersApiResponse,
} from '../types/connection.types';

const API_BASE = `${API_CONFIG.BASE_URL}/api/connections`;

const api = axios.create({
  baseURL: API_BASE,
  ...DEFAULT_AXIOS_CONFIG,
  timeout: API_CONFIG.TIMEOUT.DEFAULT,
});

// Request interceptor for caching
api.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const cacheKey = `${config.url}_${JSON.stringify(config.params)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return Promise.reject({ cached: true, data: cached });
    }
  }
  return config;
});

// Response interceptor for caching
api.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}_${JSON.stringify(response.config.params)}`;
      apiCache.set(cacheKey, response.data);
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

export const connectionApi = {
  sendRequest: (data: SendConnectionRequestRequest) =>
    api.post<SendConnectionApiResponse>('/request', data),

  acceptRequest: (connectionId: number) =>
    api.put<AcceptConnectionApiResponse>(`/request/${connectionId}/accept`),

  declineRequest: (connectionId: number) =>
    api.put<DeclineConnectionApiResponse>(`/request/${connectionId}/decline`),

  blockUser: (userId: number) =>
    api.post<BlockUserApiResponse>(`/block/${userId}`),

  unblockUser: (userId: number) =>
    api.delete<UnblockUserApiResponse>(`/block/${userId}`),

  removeConnection: (userId: number) =>
    api.delete<RemoveConnectionApiResponse>(`/remove/${userId}`),

  getPendingRequests: () =>
    api.get<PendingRequestsApiResponse>('/pending'),

  getSentRequests: () =>
    api.get<SentRequestsApiResponse>('/sent'),

  getConnections: () =>
    api.get<ConnectionsListApiResponse>('/list'),

  getBlockedUsers: () =>
    api.get<BlockedUsersApiResponse>('/blocked'),

  getConnectionStatus: (userId: number) =>
    api.get<ConnectionStatusApiResponse>(`/status/${userId}`),

  getStats: () =>
    api.get<ConnectionStatsApiResponse>('/stats'),

  getConnectedUsers: () =>
    api.get<ConnectedUsersApiResponse>('/users'),
};
