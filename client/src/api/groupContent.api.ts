import axios from 'axios';
import { API_CONFIG, DEFAULT_AXIOS_CONFIG } from '../config/api';
import type { ApiResponse, CreatePollRequest, CreateAnnouncementRequest, Poll, Announcement } from '../types';

const BASE_URL = `${API_CONFIG.BASE_URL}/api/groups`;

const groupContentApiClient = axios.create({
  baseURL: BASE_URL,
  ...DEFAULT_AXIOS_CONFIG,
  timeout: API_CONFIG.TIMEOUT.USER_API
});

export const groupContentApi = {
  createPoll: (groupId: string, pollData: CreatePollRequest) =>
    groupContentApiClient.post<ApiResponse<Poll>>(`/${groupId}/polls`, pollData),

  getPolls: (groupId: string) =>
    groupContentApiClient.get<ApiResponse<Poll[]>>(`/${groupId}/polls`),

  deletePoll: (messageId: string) =>
    groupContentApiClient.delete<ApiResponse<any>>(`/polls/${messageId}`),

  createAnnouncement: (groupId: string, announcementData: CreateAnnouncementRequest) =>
    groupContentApiClient.post<ApiResponse<Announcement>>(`/${groupId}/announcements`, announcementData),

  getAnnouncements: (groupId: string) =>
    groupContentApiClient.get<ApiResponse<Announcement[]>>(`/${groupId}/announcements`),

  pinMessage: (groupId: string, messageId: string) =>
    groupContentApiClient.post<ApiResponse<any>>(`/${groupId}/messages/${messageId}/pin`),

  unpinMessage: (groupId: string, messageId: string) =>
    groupContentApiClient.delete<ApiResponse<any>>(`/${groupId}/messages/${messageId}/pin`),

  getPinnedMessages: (groupId: string) =>
    groupContentApiClient.get<ApiResponse<any[]>>(`/${groupId}/messages/pinned`),
};