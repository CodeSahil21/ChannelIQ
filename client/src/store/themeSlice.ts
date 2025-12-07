import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface ThemeState {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  language: string;
  timezone: string;
}

const initialState: ThemeState = {
  theme: 'light',
  notificationsEnabled: true,
  language: 'en',
  timezone: 'UTC'
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setPreferences: (state, action: PayloadAction<Partial<ThemeState>>) => {
      Object.assign(state, action.payload);
    }
  },
});

export const { setTheme, setPreferences } = themeSlice.actions;
export default themeSlice.reducer;