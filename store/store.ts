import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import eventsReducer from "./slices/eventsSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    events: eventsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
