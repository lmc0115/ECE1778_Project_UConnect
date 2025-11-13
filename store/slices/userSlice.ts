import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../lib/supabase";
import { RootState } from "../store";

/* ─────────────────────────────────────────────
   Thunks: signup, login, logout
───────────────────────────────────────────── */

// SIGN UP
export const signupUser = createAsyncThunk(
  "user/signupUser",
  async (
    {
      email,
      password,
      role,
    }: { email: string; password: string; role: "student" | "organizer" },
    { rejectWithValue }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }, // save role in Supabase user_metadata
        emailRedirectTo: "exp://127.0.0.1:19000", // change this to your Expo dev URL
      },
    });
    if (error) return rejectWithValue(error.message);
    return data.user;
  }
);

// LOGIN
export const loginUser = createAsyncThunk(
  "user/loginUser",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return rejectWithValue(error.message);

    const user = data.user;
    const role = user?.user_metadata?.role ?? "student"; // default fallback
    return { user, role };
  }
);

// LOGOUT
export const logoutUser = createAsyncThunk("user/logoutUser", async () => {
  await supabase.auth.signOut();
});

/* ─────────────────────────────────────────────
   Slice
───────────────────────────────────────────── */

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null as any,
    role: null as "student" | "organizer" | null,
    status: "idle" as "idle" | "loading" | "succeeded" | "failed",
    error: null as string | null,
  },
  reducers: {
    setRole(state, action) {
      state.role = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // SIGNUP
      .addCase(signupUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.role = action.payload?.user_metadata?.role ?? null;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.role = null;
        state.status = "idle";
      });
  },
});

/* ─────────────────────────────────────────────
   Exports
───────────────────────────────────────────── */

export const { setRole } = userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectUser = (state: RootState) => state.user.user;
export const selectIsAuthed = (state: RootState) => Boolean(state.user.user);
export const selectRole = (state: RootState) => state.user.role;
export const selectUserStatus = (state: RootState) => state.user.status;
export const selectUserError = (state: RootState) => state.user.error;
