// store/slices/themeSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { saveTheme } from "../../lib/themeStorage";

export type ThemeMode = "light" | "dark";

type ThemeState = {
  theme: ThemeMode;
};

const initialState: ThemeState = {
  theme: "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
      saveTheme(action.payload);
    },
    toggleTheme: (state) => {
      const next: ThemeMode = state.theme === "light" ? "dark" : "light";
      state.theme = next;
      saveTheme(next);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
