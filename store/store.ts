import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import eventsReducer from "./slices/eventsSlice";
import activityRefreshReducer from "./slices/activityRefreshSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    events: eventsReducer,
    activityRefresh: activityRefreshReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
