import axios from 'axios';
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

const API_BASE = 'http://localhost:4000/api/connections';
const USER_API_BASE = 'http://localhost:4000/api/users';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

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
