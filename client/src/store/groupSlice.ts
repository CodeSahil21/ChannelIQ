import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG, DEFAULT_AXIOS_CONFIG } from '../config/api';
import type { 
  GroupState, 
  CreateGroupRequest, 
  UpdateGroupRequest, 
  ApiResponse, 
  UserGroup, 
  Group, 
  PendingRequestsResponse,
  SearchGroupsResponse 
} from '../types/group.types';

const initialState: GroupState = {
  groups: [],
  currentGroup: null,
  pendingRequests: null,
  searchResults: [],
  loading: false,
  error: null,
};

// Create Group
export const createGroup = createAsyncThunk(
  'groups/create',
  async (groupData: CreateGroupRequest, { rejectWithValue }) => {
    try {
      const response = await axios.post<ApiResponse<Group>>(
        `${API_CONFIG.BASE_URL}/api/groups/create`,
        groupData,
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create group';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Get My Groups
export const getMyGroups = createAsyncThunk(
  'groups/getMyGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<ApiResponse<UserGroup[]>>(
        `${API_CONFIG.BASE_URL}/api/groups/my-groups`,
        { ...DEFAULT_AXIOS_CONFIG }
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch groups';
      return rejectWithValue(message);
    }
  }
);

// Search Groups
export const searchGroups = createAsyncThunk(
  'groups/search',
  async (searchTerm: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<ApiResponse<SearchGroupsResponse>>(
        `${API_CONFIG.BASE_URL}/api/groups/search?search=${encodeURIComponent(searchTerm)}`,
        { ...DEFAULT_AXIOS_CONFIG }
      );
      return response.data.data.groups;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to search groups';
      return rejectWithValue(message);
    }
  }
);

// Get Pending Requests
export const getPendingRequests = createAsyncThunk(
  'groups/getPendingRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<ApiResponse<PendingRequestsResponse>>(
        `${API_CONFIG.BASE_URL}/api/groups/requests/pending`,
        { ...DEFAULT_AXIOS_CONFIG }
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch pending requests';
      return rejectWithValue(message);
    }
  }
);

// Join Group
export const joinGroup = createAsyncThunk(
  'groups/join',
  async ({ groupId, message }: { groupId: string; message?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}/join`,
        { message },
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to join group';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Respond to Request
export const respondToRequest = createAsyncThunk(
  'groups/respondToRequest',
  async ({ requestId, status }: { requestId: string; status: 'ACCEPTED' | 'REJECTED' }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/api/groups/requests/${requestId}`,
        { status },
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return { requestId, status };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to respond to request';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Update Group
export const updateGroup = createAsyncThunk(
  'groups/update',
  async ({ groupId, data }: { groupId: string; data: UpdateGroupRequest }, { rejectWithValue }) => {
    try {
      const response = await axios.put<ApiResponse<Group>>(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}`,
        data,
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update group';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Delete Group
export const deleteGroup = createAsyncThunk(
  'groups/delete',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}`,
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return groupId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete group';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Invite User
export const inviteUser = createAsyncThunk(
  'groups/inviteUser',
  async ({ groupId, targetUserId, message }: { groupId: string; targetUserId: number; message?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}/invite`,
        { targetUserId, message },
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to invite user';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Remove Member
export const removeMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, userId }: { groupId: string; userId: number }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}/members/${userId}`,
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return { groupId, userId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove member';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Leave Group
export const leaveGroup = createAsyncThunk(
  'groups/leave',
  async ({ groupId, userId }: { groupId: string; userId: number }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}/members/${userId}`,
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return groupId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to leave group';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Get Group Details
export const getGroupDetails = createAsyncThunk(
  'groups/getDetails',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<ApiResponse<Group>>(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}`,
        { ...DEFAULT_AXIOS_CONFIG }
      );
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch group details';
      return rejectWithValue(message);
    }
  }
);



// Update Member Role
export const updateMemberRole = createAsyncThunk(
  'groups/updateMemberRole',
  async ({ groupId, userId, role }: { groupId: string; userId: number; role: 'ADMIN' | 'CO_ADMIN' | 'MEMBER' }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}/members/${userId}/role`,
        { role },
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update member role';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Update Member Settings
export const updateMemberSettings = createAsyncThunk(
  'groups/updateMemberSettings',
  async ({ groupId, isMuted, muteUntil }: { groupId: string; isMuted?: boolean; muteUntil?: string | null }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}/settings`,
        { isMuted, muteUntil },
        { ...DEFAULT_AXIOS_CONFIG }
      );
      toast.success(response.data.message);
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update settings';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload;
    },
    refreshGroupsNeeded: (state) => {
      // Flag that groups need to be refreshed
      state.error = null;
    },
    refreshCurrentGroupNeeded: (state) => {
      // Flag that current group needs to be refreshed
      state.error = null;
    },
    updateGroupImage: (state, action) => {
      const { groupId, imageUrl } = action.payload;
      // Update current group image
      if (state.currentGroup && state.currentGroup.id === groupId) {
        state.currentGroup.imageUrl = imageUrl;
      }
      // Update in groups list
      const groupIndex = state.groups.findIndex(g => g.groupId === groupId);
      if (groupIndex !== -1) {
        state.groups[groupIndex].group.imageUrl = imageUrl;
      }
      // Update in search results
      const searchIndex = state.searchResults.findIndex(g => g.id === groupId);
      if (searchIndex !== -1) {
        state.searchResults[searchIndex].imageUrl = imageUrl;
      }
    },
    updateGroupDetails: (state, action) => {
      const { groupId, updates } = action.payload;
      // Update current group
      if (state.currentGroup?.id === groupId) {
        state.currentGroup = { ...state.currentGroup, ...updates };
      }
      // Update in groups list
      const groupIndex = state.groups.findIndex(g => g.groupId === groupId);
      if (groupIndex !== -1) {
        state.groups[groupIndex].group = { ...state.groups[groupIndex].group, ...updates };
      }
      // Update in search results
      const searchIndex = state.searchResults.findIndex(g => g.id === groupId);
      if (searchIndex !== -1) {
        state.searchResults[searchIndex] = { ...state.searchResults[searchIndex], ...updates };
      }
    },
    updateMemberCount: (state, action) => {
      const { groupId, count } = action.payload;
      // Update current group member count
      if (state.currentGroup?.id === groupId && state.currentGroup?._count) {
        state.currentGroup._count.members = count;
      }
      // Update in groups list
      const groupIndex = state.groups.findIndex(g => g.groupId === groupId);
      if (groupIndex !== -1 && state.groups[groupIndex].group._count) {
        state.groups[groupIndex].group._count.members = count;
      }
      // Update in search results
      const searchIndex = state.searchResults.findIndex(g => g.id === groupId);
      if (searchIndex !== -1 && state.searchResults[searchIndex]._count) {
        state.searchResults[searchIndex]._count.members = count;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Group
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.loading = false;
        // Note: Will need to refresh groups list after creation
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get My Groups
      .addCase(getMyGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(getMyGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Search Groups
      .addCase(searchGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get Pending Requests
      .addCase(getPendingRequests.fulfilled, (state, action) => {
        state.pendingRequests = action.payload;
      })
      
      // Join Group
      .addCase(joinGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(joinGroup.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(joinGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Respond to Request
      .addCase(respondToRequest.fulfilled, (state, action) => {
        // Remove the request from pending requests
        if (state.pendingRequests) {
          state.pendingRequests.invites = state.pendingRequests.invites.filter(
            req => req.id !== action.payload.requestId
          );
          state.pendingRequests.joinRequests = state.pendingRequests.joinRequests.filter(
            req => req.id !== action.payload.requestId
          );
        }
      })
      
      // Update Group
      .addCase(updateGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.loading = false;
        // Update current group
        if (state.currentGroup?.id === action.payload.id) {
          state.currentGroup = action.payload;
        }
        // Update in groups list
        const groupIndex = state.groups.findIndex(g => g.groupId === action.payload.id);
        if (groupIndex !== -1) {
          state.groups[groupIndex].group = { ...state.groups[groupIndex].group, ...action.payload };
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete Group
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g.groupId !== action.payload);
        if (state.currentGroup?.id === action.payload) {
          state.currentGroup = null;
        }
      })
      
      // Invite User
      .addCase(inviteUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(inviteUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(inviteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Remove Member
      .addCase(removeMember.fulfilled, (state, action) => {
        const { groupId, userId } = action.payload;
        // Update member count in current group
        if (state.currentGroup?.id === groupId && state.currentGroup?._count) {
          state.currentGroup._count.members -= 1;
        }
        // Update member count in groups list
        const groupIndex = state.groups.findIndex(g => g.groupId === groupId);
        if (groupIndex !== -1 && state.groups[groupIndex].group._count) {
          state.groups[groupIndex].group._count.members -= 1;
        }
        // Update member count in search results
        const searchIndex = state.searchResults.findIndex(g => g.id === groupId);
        if (searchIndex !== -1 && state.searchResults[searchIndex]._count) {
          state.searchResults[searchIndex]._count.members -= 1;
        }
      })
      
      // Leave Group
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g.groupId !== action.payload);
        if (state.currentGroup?.id === action.payload) {
          state.currentGroup = null;
        }
      })
      
      // Get Group Details
      .addCase(getGroupDetails.pending, (state) => {
        // Don't set global loading for group details to prevent page refresh effect
        state.error = null;
      })
      .addCase(getGroupDetails.fulfilled, (state, action) => {
        // Don't modify global loading state to prevent page refresh effect
        state.currentGroup = action.payload;
      })
      .addCase(getGroupDetails.rejected, (state, action) => {
        // Don't modify global loading state to prevent page refresh effect
        state.error = action.payload as string;
      })
      

      
      // Update Member Role
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        state.loading = false;
        // Update member role in current group
        if (state.currentGroup?.members) {
          const memberIndex = state.currentGroup.members.findIndex(m => m.userId === action.payload.userId);
          if (memberIndex !== -1) {
            state.currentGroup.members[memberIndex] = action.payload;
          }
        }
      })
      
      // Update Member Settings
      .addCase(updateMemberSettings.fulfilled, (state, action) => {
        // Note: Will need to refresh current group details after settings update
        state.loading = false;
      });
  },
});

export const { clearError, clearSearchResults, setCurrentGroup, refreshGroupsNeeded, refreshCurrentGroupNeeded, updateGroupImage, updateGroupDetails, updateMemberCount } = groupSlice.actions;
export default groupSlice.reducer;