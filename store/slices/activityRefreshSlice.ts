import { createSlice } from "@reduxjs/toolkit";

const activityRefreshSlice = createSlice({
  name: "activityRefresh",
  initialState: { refreshFlag: false },
  reducers: {
    triggerRefresh(state) {
      state.refreshFlag = !state.refreshFlag; // toggle to force rerender
    },
  },
});

export const { triggerRefresh } = activityRefreshSlice.actions;

export const selectActivityRefreshFlag = (state) =>
  state.activityRefresh.refreshFlag;

export default activityRefreshSlice.reducer;
