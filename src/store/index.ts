import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import chatReducer from "./slices/chatSlice";
import feedReducer from "./slices/feedSlice";
import privacyReducer from "./slices/privacySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    chat: chatReducer,
    feed: feedReducer,
    privacy: privacyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
