import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import themeReducer from "./themeSlice";
import connectionReducer from "./connectionSlice";
import groupReducer from "./groupSlice";
import mediaReducer from "./mediaSlice";
import profileReducer from "./profileSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    theme: themeReducer,
    connections: connectionReducer,
    groups: groupReducer,
    media: mediaReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;