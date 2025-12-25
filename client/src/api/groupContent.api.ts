import axios from 'axios';
import type { ApiResponse, CreatePollRequest, CreateAnnouncementRequest, Poll, Announcement } from '../types';

const BASE_URL = 'http://localhost:4000/api/groups';

const groupContentApiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 8000
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