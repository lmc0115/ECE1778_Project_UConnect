import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import eventsReducer from "./slices/eventsSlice";
import activityRefreshReducer from "./slices/activityRefreshSlice";
import themeReducer from "./slices/themeSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    events: eventsReducer,
    activityRefresh: activityRefreshReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
