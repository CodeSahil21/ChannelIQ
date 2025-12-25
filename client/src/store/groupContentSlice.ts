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
  pinnedMessages: {
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

export const deletePoll = createAsyncThunk(
  'groupContent/deletePoll',
  async (messageId: string) => {
    const response = await groupContentApi.deletePoll(messageId);
    return { messageId, ...response.data };
  }
);

export const fetchPinnedMessages = createAsyncThunk(
  'groupContent/fetchPinnedMessages',
  async (groupId: string) => {
    const response = await groupContentApi.getPinnedMessages(groupId);
    return response.data.data!;
  }
);

export const pinMessage = createAsyncThunk(
  'groupContent/pinMessage',
  async ({ groupId, messageId }: { groupId: string; messageId: string }) => {
    const response = await groupContentApi.pinMessage(groupId, messageId);
    return response.data.data!;
  }
);

export const unpinMessage = createAsyncThunk(
  'groupContent/unpinMessage',
  async ({ groupId, messageId }: { groupId: string; messageId: string }) => {
    const response = await groupContentApi.unpinMessage(groupId, messageId);
    return { messageId };
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
      })

    // Delete Poll
      .addCase(deletePoll.pending, (state) => {
        state.polls.loading = true;
        state.polls.error = null;
      })
      .addCase(deletePoll.fulfilled, (state, action) => {
        state.polls.loading = false;
        state.polls.items = state.polls.items.filter(poll => poll.messageId !== action.meta.arg);
      })
      .addCase(deletePoll.rejected, (state, action) => {
        state.polls.loading = false;
        state.polls.error = action.error.message || 'Failed to delete poll';
      })

    // Fetch Pinned Messages
      .addCase(fetchPinnedMessages.pending, (state) => {
        state.pinnedMessages.loading = true;
        state.pinnedMessages.error = null;
      })
      .addCase(fetchPinnedMessages.fulfilled, (state, action) => {
        state.pinnedMessages.loading = false;
        state.pinnedMessages.items = action.payload;
      })
      .addCase(fetchPinnedMessages.rejected, (state, action) => {
        state.pinnedMessages.loading = false;
        state.pinnedMessages.error = action.error.message || 'Failed to fetch pinned messages';
      })

    // Pin Message
      .addCase(pinMessage.pending, (state) => {
        state.pinnedMessages.loading = true;
        state.pinnedMessages.error = null;
      })
      .addCase(pinMessage.fulfilled, (state, action) => {
        state.pinnedMessages.loading = false;
        state.pinnedMessages.items.unshift(action.payload);
      })
      .addCase(pinMessage.rejected, (state, action) => {
        state.pinnedMessages.loading = false;
        state.pinnedMessages.error = action.error.message || 'Failed to pin message';
      })

    // Unpin Message
      .addCase(unpinMessage.pending, (state) => {
        state.pinnedMessages.loading = true;
        state.pinnedMessages.error = null;
      })
      .addCase(unpinMessage.fulfilled, (state, action) => {
        state.pinnedMessages.loading = false;
        state.pinnedMessages.items = state.pinnedMessages.items.filter(msg => msg.messageId !== action.payload.messageId);
      })
      .addCase(unpinMessage.rejected, (state, action) => {
        state.pinnedMessages.loading = false;
        state.pinnedMessages.error = action.error.message || 'Failed to unpin message';
      });
  },
});

export const { clearErrors } = groupContentSlice.actions;
export default groupContentSlice.reducer;