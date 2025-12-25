import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { groupContentApi } from '../api/groupContent.api';
import type { 
  GroupContentState, 
  CreatePollRequest, 
  CreateAnnouncementRequest, 
  Poll, 
  Announcement 
} from '../types/groupContent.types';

const initialState: GroupContentState = {
  polls: {
    items: [],
    loading: false,
    error: null,
  },
  announcements: {
    items: [],
    loading: false,
    error: null,
  },
};

// Async thunks
export const createPoll = createAsyncThunk(
  'groupContent/createPoll',
  async ({ groupId, pollData }: { groupId: string; pollData: CreatePollRequest }) => {
    const response = await groupContentApi.createPoll(groupId, pollData);
    return response.data.data!;
  }
);

export const createAnnouncement = createAsyncThunk(
  'groupContent/createAnnouncement',
  async ({ groupId, announcementData }: { groupId: string; announcementData: CreateAnnouncementRequest }) => {
    const response = await groupContentApi.createAnnouncement(groupId, announcementData);
    return response.data.data!;
  }
);

export const fetchAnnouncements = createAsyncThunk(
  'groupContent/fetchAnnouncements',
  async (groupId: string) => {
    const response = await groupContentApi.getAnnouncements(groupId);
    return response.data.data!;
  }
);

export const fetchPolls = createAsyncThunk(
  'groupContent/fetchPolls',
  async (groupId: string) => {
    const response = await groupContentApi.getPolls(groupId);
    return response.data.data!;
  }
);

const groupContentSlice = createSlice({
  name: 'groupContent',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.polls.error = null;
      state.announcements.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create Poll
    builder
      .addCase(createPoll.pending, (state) => {
        state.polls.loading = true;
        state.polls.error = null;
      })
      .addCase(createPoll.fulfilled, (state, action) => {
        state.polls.loading = false;
        state.polls.items.unshift(action.payload);
      })
      .addCase(createPoll.rejected, (state, action) => {
        state.polls.loading = false;
        state.polls.error = action.error.message || 'Failed to create poll';
      })

    // Create Announcement
      .addCase(createAnnouncement.pending, (state) => {
        state.announcements.loading = true;
        state.announcements.error = null;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.announcements.loading = false;
        state.announcements.items.unshift(action.payload);
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.announcements.loading = false;
        state.announcements.error = action.error.message || 'Failed to create announcement';
      })

    // Fetch Announcements
      .addCase(fetchAnnouncements.pending, (state) => {
        state.announcements.loading = true;
        state.announcements.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.announcements.loading = false;
        state.announcements.items = action.payload;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.announcements.loading = false;
        state.announcements.error = action.error.message || 'Failed to fetch announcements';
      })

    // Fetch Polls
      .addCase(fetchPolls.pending, (state) => {
        state.polls.loading = true;
        state.polls.error = null;
      })
      .addCase(fetchPolls.fulfilled, (state, action) => {
        state.polls.loading = false;
        state.polls.items = action.payload;
      })
      .addCase(fetchPolls.rejected, (state, action) => {
        state.polls.loading = false;
        state.polls.error = action.error.message || 'Failed to fetch polls';
      });
  },
});

export const { clearErrors } = groupContentSlice.actions;
export default groupContentSlice.reducer;