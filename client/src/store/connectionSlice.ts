import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { connectionApi } from '../api/connection.api';
import type { 
  ConnectionResponse, 
  ConnectedUser, 
  ConnectionStatsResponse,
  SendConnectionRequestRequest
} from '../types/connection.types';

interface ConnectionState {
  connections: ConnectedUser[];
  pendingRequests: ConnectionResponse[];
  sentRequests: ConnectionResponse[];
  blockedUsers: ConnectionResponse[];
  stats: ConnectionStatsResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConnectionState = {
  connections: [],
  pendingRequests: [],
  sentRequests: [],
  blockedUsers: [],
  stats: null,
  loading: false,
  error: null,
};

// Async thunks
export const sendConnectionRequest = createAsyncThunk(
  'connections/sendRequest',
  async (data: SendConnectionRequestRequest, { rejectWithValue }) => {
    try {
      const response = await connectionApi.sendRequest(data);
      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message || 'Failed to send request');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send request');
    }
  }
);

export const acceptConnectionRequest = createAsyncThunk(
  'connections/acceptRequest',
  async (connectionId: number, { rejectWithValue }) => {
    try {
      const response = await connectionApi.acceptRequest(connectionId);
      if (response.data.success) {
        return { connectionId, data: response.data.data };
      } else {
        return rejectWithValue(response.data.message || 'Failed to accept request');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept request');
    }
  }
);

export const declineConnectionRequest = createAsyncThunk(
  'connections/declineRequest',
  async (connectionId: number, { rejectWithValue }) => {
    try {
      const response = await connectionApi.declineRequest(connectionId);
      if (response.data.success) {
        return { connectionId, data: response.data.data };
      } else {
        return rejectWithValue(response.data.message || 'Failed to decline request');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to decline request');
    }
  }
);

export const blockUser = createAsyncThunk(
  'connections/blockUser',
  async (userId: number, { rejectWithValue }) => {
    try {
      await connectionApi.blockUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to block user');
    }
  }
);

export const unblockUser = createAsyncThunk(
  'connections/unblockUser',
  async (userId: number, { rejectWithValue }) => {
    try {
      await connectionApi.unblockUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unblock user');
    }
  }
);

export const removeConnection = createAsyncThunk(
  'connections/removeConnection',
  async (userId: number, { rejectWithValue }) => {
    try {
      await connectionApi.removeConnection(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove connection');
    }
  }
);

export const fetchPendingRequests = createAsyncThunk(
  'connections/fetchPendingRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await connectionApi.getPendingRequests();
      if (response.data.success) {
        return response.data.data || [];
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch pending requests');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending requests');
    }
  }
);

export const fetchSentRequests = createAsyncThunk(
  'connections/fetchSentRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await connectionApi.getSentRequests();
      if (response.data.success) {
        return response.data.data || [];
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch sent requests');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sent requests');
    }
  }
);

export const fetchConnections = createAsyncThunk(
  'connections/fetchConnections',
  async (_, { rejectWithValue }) => {
    try {
      const response = await connectionApi.getConnectedUsers();
      if (response.data.success) {
        return response.data.data || [];
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch connections');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch connections');
    }
  }
);

export const fetchBlockedUsers = createAsyncThunk(
  'connections/fetchBlockedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await connectionApi.getBlockedUsers();
      if (response.data.success) {
        return response.data.data || [];
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch blocked users');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch blocked users');
    }
  }
);

export const fetchConnectionStats = createAsyncThunk(
  'connections/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await connectionApi.getStats();
      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch stats');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const getConnectionStatus = createAsyncThunk(
  'connections/getStatus',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await connectionApi.getConnectionStatus(userId);
      if (response.data.success) {
        return response.data.data?.status || null;
      } else {
        return rejectWithValue(response.data.message || 'Failed to get status');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get status');
    }
  }
);

const connectionSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send request
      .addCase(sendConnectionRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to send request';
      })

      // Accept request
      .addCase(acceptConnectionRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(acceptConnectionRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRequests = state.pendingRequests.filter(
          req => req.id !== action.payload.connectionId
        );
      })
      .addCase(acceptConnectionRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to accept request';
      })

      // Decline request
      .addCase(declineConnectionRequest.fulfilled, (state, action) => {
        state.pendingRequests = state.pendingRequests.filter(
          req => req.id !== action.payload.connectionId
        );
      })

      // Block user
      .addCase(blockUser.fulfilled, (state, action) => {
        state.connections = state.connections.filter(
          conn => conn.id !== action.payload
        );
      })

      // Unblock user
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.blockedUsers = state.blockedUsers.filter(
          user => user.receiver?.id !== action.payload && user.sender?.id !== action.payload
        );
      })

      // Remove connection
      .addCase(removeConnection.fulfilled, (state, action) => {
        state.connections = state.connections.filter(
          conn => conn.id !== action.payload
        );
      })

      // Fetch pending requests
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.pendingRequests = action.payload;
        state.loading = false;
      })

      // Fetch sent requests
      .addCase(fetchSentRequests.fulfilled, (state, action) => {
        state.sentRequests = action.payload;
        state.loading = false;
      })

      // Fetch connections
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.connections = action.payload;
        state.loading = false;
      })

      // Fetch blocked users
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        state.blockedUsers = action.payload;
        state.loading = false;
      })

      // Fetch stats
      .addCase(fetchConnectionStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // Handle loading states for fetch operations
      .addMatcher(
        (action) => action.type.startsWith('connections/fetch') && action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('connections/') && action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.loading = false;
          state.error = action.error?.message || 'Operation failed';
        }
      );
  },
});

export const { clearError } = connectionSlice.actions;
export default connectionSlice.reducer;