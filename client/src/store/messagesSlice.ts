import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Message {
  id: string;
  content: string | null;
  type: string;
  senderId: number;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  sender: {
    id: number;
    fullName: string;
    profileUrl?: string;
  };
  reactions: Array<{
    id: string;
    emoji: string;
    userId: number;
    user: { fullName: string };
  }>;
}

interface MessagesState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: [],
  loading: false,
  error: null,
};

// Async thunk for initial message fetching
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (groupId: string) => {
    const response = await fetch(`http://localhost:4000/api/groups/${groupId}/messages`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    const data = await response.json();
    return data.data;
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Real-time socket actions
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateMessage: (state, action) => {
      const { messageId, content, isDeleted, updatedAt } = action.payload;
      const message = state.messages.find(msg => msg.id === messageId);
      if (message) {
        message.content = isDeleted ? null : content || message.content;
        message.isDeleted = isDeleted;
        message.updatedAt = updatedAt;
      }
    },
    updateReaction: (state, action) => {
      const { messageId, emoji, userId, action: reactionAction } = action.payload;
      const message = state.messages.find(msg => msg.id === messageId);
      if (message) {
        if (reactionAction === 'add') {
          const existingIndex = message.reactions.findIndex(r => r.emoji === emoji && r.userId === userId);
          if (existingIndex === -1) {
            message.reactions.push({
              id: `${messageId}-${emoji}-${userId}`,
              emoji,
              userId,
              user: { fullName: 'User' }
            });
          }
        } else if (reactionAction === 'remove') {
          message.reactions = message.reactions.filter(r => !(r.emoji === emoji && r.userId === userId));
        }
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch messages';
      });
  },
});

export const { addMessage, updateMessage, updateReaction, clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;