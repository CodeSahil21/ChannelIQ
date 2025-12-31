import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { meetingApi } from '../api/meeting.api';
import type {
  Meeting,
  MeetingParticipant,
  MeetingState,
  CreateMeetingRequest,
  JoinMeetingRequest,
  SetPasswordRequest,
  PromoteUserRequest,
  ParticipantRole
} from '../types/meeting.types';

const initialState: MeetingState = {
  currentMeeting: null,
  participants: [],
  userRole: null,
  loading: false,
  error: null,
  joinLoading: false,
  tokenLoading: false,
  liveKitReady: false
};

export const createMeeting = createAsyncThunk(
  'meeting/createMeeting',
  async (data: CreateMeetingRequest, { rejectWithValue }) => {
    try {
      return await meetingApi.createMeeting(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const searchMeeting = createAsyncThunk(
  'meeting/searchMeeting',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      return await meetingApi.searchMeeting(meetingId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const joinMeeting = createAsyncThunk(
  'meeting/joinMeeting',
  async ({ meetingId, data }: { meetingId: string; data: JoinMeetingRequest }, { rejectWithValue }) => {
    try {
      const result = await meetingApi.joinMeeting(meetingId, data);
      return result.role as ParticipantRole;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getLiveKitToken = createAsyncThunk(
  'meeting/getLiveKitToken',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      return await meetingApi.getLiveKitToken(meetingId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const startMeeting = createAsyncThunk(
  'meeting/startMeeting',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      await meetingApi.startMeeting(meetingId);
      return meetingId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const endMeeting = createAsyncThunk(
  'meeting/endMeeting',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      await meetingApi.endMeeting(meetingId);
      return meetingId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const setPassword = createAsyncThunk(
  'meeting/setPassword',
  async ({ meetingId, data }: { meetingId: string; data: SetPasswordRequest }, { rejectWithValue }) => {
    try {
      await meetingApi.setPassword(meetingId, data);
      return meetingId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const removePassword = createAsyncThunk(
  'meeting/removePassword',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      await meetingApi.removePassword(meetingId);
      return meetingId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const promoteCoHost = createAsyncThunk(
  'meeting/promoteCoHost',
  async ({ meetingId, data }: { meetingId: string; data: PromoteUserRequest }, { rejectWithValue }) => {
    try {
      await meetingApi.promoteCoHost(meetingId, data);
      return data.userId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const demoteCoHost = createAsyncThunk(
  'meeting/demoteCoHost',
  async ({ meetingId, data }: { meetingId: string; data: PromoteUserRequest }, { rejectWithValue }) => {
    try {
      await meetingApi.demoteCoHost(meetingId, data);
      return data.userId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const leaveMeeting = createAsyncThunk(
  'meeting/leaveMeeting',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      await meetingApi.leaveMeeting(meetingId);
      return meetingId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchMeeting = createAsyncThunk(
  'meeting/fetchMeeting',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      return await meetingApi.getMeeting(meetingId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLiveKitReady: (state, action: PayloadAction<boolean>) => {
      state.liveKitReady = action.payload;
    },
    updateParticipant: (state, action: PayloadAction<MeetingParticipant>) => {
      const index = state.participants.findIndex(p => p.userId === action.payload.userId);
      if (index !== -1) {
        // Update existing participant, preserve joinedAt if not provided
        state.participants[index] = {
          ...state.participants[index],
          ...action.payload,
          joinedAt: action.payload.joinedAt || state.participants[index].joinedAt
        };
      } else {
        // Add new participant
        state.participants.push(action.payload);
      }
      console.log('📊 Updated participants:', state.participants.length);
    },
    removeParticipant: (state, action: PayloadAction<number>) => {
      const beforeCount = state.participants.length;
      state.participants = state.participants.filter(p => p.userId !== action.payload);
      console.log(`📊 Removed participant ${action.payload}, count: ${beforeCount} → ${state.participants.length}`);
    },
    updateMeetingStatus: (state, action: PayloadAction<'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'>) => {
      if (state.currentMeeting) {
        state.currentMeeting.status = action.payload;
        console.log(`📊 Meeting status updated: ${action.payload}`);
      }
    },
    // Real-time socket actions (matching chat pattern)
    socketParticipantJoined: (state, action: PayloadAction<MeetingParticipant>) => {
      const index = state.participants.findIndex(p => p.userId === action.payload.userId);
      if (index === -1) {
        state.participants.push(action.payload);
        console.log(`📊 Participant joined via socket: ${action.payload.userName}`);
      }
    },
    socketParticipantLeft: (state, action: PayloadAction<number>) => {
      const beforeCount = state.participants.length;
      state.participants = state.participants.filter(p => p.userId !== action.payload);
      console.log(`📊 Participant left via socket: ${action.payload}, count: ${beforeCount} → ${state.participants.length}`);
    },
    socketParticipantRoleChanged: (state, action: PayloadAction<{userId: number, newRole: ParticipantRole}>) => {
      const participant = state.participants.find(p => p.userId === action.payload.userId);
      if (participant) {
        participant.role = action.payload.newRole;
        console.log(`📊 Participant role changed via socket: ${action.payload.userId} → ${action.payload.newRole}`);
      }
    },
    socketMeetingStatusChanged: (state, action: PayloadAction<'LIVE' | 'ENDED'>) => {
      if (state.currentMeeting) {
        state.currentMeeting.status = action.payload;
        console.log(`📊 Meeting status changed via socket: ${action.payload}`);
      }
    },
    resetMeetingState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Create Meeting
      .addCase(createMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeeting = action.payload;
        state.userRole = 'HOST';
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Search Meeting
      .addCase(searchMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeeting = action.payload;
      })
      .addCase(searchMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Join Meeting
      .addCase(joinMeeting.pending, (state) => {
        state.joinLoading = true;
        state.error = null;
      })
      .addCase(joinMeeting.fulfilled, (state, action) => {
        state.joinLoading = false;
        state.userRole = action.payload;
      })
      .addCase(joinMeeting.rejected, (state, action) => {
        state.joinLoading = false;
        state.error = action.payload as string;
      })
      
      // Get LiveKit Token
      .addCase(getLiveKitToken.pending, (state) => {
        state.tokenLoading = true;
        state.error = null;
      })
      .addCase(getLiveKitToken.fulfilled, (state) => {
        state.tokenLoading = false;
      })
      .addCase(getLiveKitToken.rejected, (state, action) => {
        state.tokenLoading = false;
        state.error = action.payload as string;
      })
      
      // Start Meeting
      .addCase(startMeeting.fulfilled, (state) => {
        if (state.currentMeeting) {
          state.currentMeeting.status = 'LIVE';
        }
      })
      .addCase(startMeeting.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // End Meeting
      .addCase(endMeeting.fulfilled, (state) => {
        if (state.currentMeeting) {
          state.currentMeeting.status = 'ENDED';
        }
      })
      .addCase(endMeeting.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Set Password
      .addCase(setPassword.fulfilled, (state) => {
        if (state.currentMeeting) {
          state.currentMeeting.passwordEnabled = true;
        }
      })
      .addCase(setPassword.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Remove Password
      .addCase(removePassword.fulfilled, (state) => {
        if (state.currentMeeting) {
          state.currentMeeting.passwordEnabled = false;
        }
      })
      .addCase(removePassword.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Leave Meeting
      .addCase(leaveMeeting.fulfilled, (state) => {
        // Reset meeting state after leaving
        state.currentMeeting = null;
        state.participants = [];
        state.userRole = null;
      })
      .addCase(leaveMeeting.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Fetch Meeting
      .addCase(fetchMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeeting = action.payload;
        // Set initial participants from API response
        if (action.payload.participants) {
          state.participants = action.payload.participants;
        }
      })
      .addCase(fetchMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  clearError,
  setLiveKitReady,
  updateParticipant,
  removeParticipant,
  updateMeetingStatus,
  socketParticipantJoined,
  socketParticipantLeft,
  socketParticipantRoleChanged,
  socketMeetingStatusChanged,
  resetMeetingState
} = meetingSlice.actions;

export default meetingSlice.reducer;