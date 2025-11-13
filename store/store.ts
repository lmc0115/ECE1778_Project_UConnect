// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import user from "./slices/userSlice";
import events from "./slices/eventsSlice";
export const store = configureStore({ reducer: { user, events } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
