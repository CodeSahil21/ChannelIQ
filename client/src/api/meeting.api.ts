import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { API_CONFIG, DEFAULT_AXIOS_CONFIG } from '../config/api';
import type {
  Meeting,
  MeetingParticipant,
  CreateMeetingRequest,
  JoinMeetingRequest,
  SetPasswordRequest,
  PromoteUserRequest,
  LiveKitTokenResponse,
  ApiResponse,
  ApiError
} from '../types/meeting.types';

class MeetingApiClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}/api/meetings`,
      ...DEFAULT_AXIOS_CONFIG,
      timeout: API_CONFIG.TIMEOUT.DEFAULT
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        const normalizedError = this.normalizeError(error);
        return Promise.reject(normalizedError);
      }
    );
  }

  private normalizeError(error: AxiosError<ApiError>): Error {
    if (error.response?.data) {
      const apiError = error.response.data;
      return new Error(apiError.message || 'An error occurred');
    }

    switch (error.response?.status) {
      case 400:
        return new Error('Invalid request data');
      case 401:
        return new Error('Authentication required');
      case 403:
        return new Error('Insufficient permissions');
      case 404:
        return new Error('Meeting not found');
      case 429:
        return new Error('Too many requests, please try again later');
      case 500:
        return new Error('Server error, please try again');
      default:
        return new Error(error.message || 'Network error');
    }
  }

  async createMeeting(data: CreateMeetingRequest): Promise<Meeting> {
    const response = await this.api.post<ApiResponse<Meeting>>('/', data);
    return response.data.data;
  }

  async searchMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.api.get<ApiResponse<Meeting>>(`/search/${meetingId}`);
    return response.data.data;
  }

  async joinMeeting(meetingId: string, data: JoinMeetingRequest): Promise<{ role: string }> {
    const response = await this.api.post<ApiResponse<{ role: string }>>(`/${meetingId}/join`, data);
    return response.data.data;
  }

  async getLiveKitToken(meetingId: string): Promise<LiveKitTokenResponse> {
    const response = await this.api.get<ApiResponse<LiveKitTokenResponse>>(`/${meetingId}/livekit-token`);
    return response.data.data;
  }

  async startMeeting(meetingId: string): Promise<void> {
    await this.api.post(`/${meetingId}/start`);
  }

  async endMeeting(meetingId: string): Promise<void> {
    await this.api.post(`/${meetingId}/end`);
  }

  async setPassword(meetingId: string, data: SetPasswordRequest): Promise<void> {
    await this.api.put(`/${meetingId}/password`, data);
  }

  async removePassword(meetingId: string): Promise<void> {
    await this.api.delete(`/${meetingId}/password`);
  }

  async promoteCoHost(meetingId: string, data: PromoteUserRequest): Promise<void> {
    await this.api.post(`/${meetingId}/promote`, data);
  }

  async demoteCoHost(meetingId: string, data: PromoteUserRequest): Promise<void> {
    await this.api.post(`/${meetingId}/demote`, data);
  }

  async leaveMeeting(meetingId: string): Promise<void> {
    await this.api.post(`/${meetingId}/leave`);
  }

  async getMeeting(meetingId: string): Promise<Meeting> {
    const response = await this.api.get<ApiResponse<Meeting>>(`/${meetingId}`);
    return response.data.data;
  }
}

export const meetingApi = new MeetingApiClient();