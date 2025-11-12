import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type Role = "student" | "organizer";
type User = { email: string } | null;

type State = {
  user: User;
  role: Role | null;
};
const initialState: State = { user: null, role: null };

const slice = createSlice({
  name: "user",
  initialState,
  reducers: {
    signIn: (s, a: PayloadAction<{ email: string; role: Role }>) => {
      s.user = { email: a.payload.email };
      s.role = a.payload.role;
    },
    signOut: (s) => {
      s.user = null; s.role = null;
    },
    setRole: (s, a: PayloadAction<Role>) => { s.role = a.payload; },
  },
});

export const { signIn, signOut, setRole } = slice.actions;
export default slice.reducer;

export const selectIsAuthed = (state: RootState) => Boolean(state.user.user);
export const selectUser = (state: RootState) => state.user.user;
export const selectRole = (state: RootState) => state.user.role;
