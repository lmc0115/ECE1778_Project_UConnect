import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../lib/supabase";
import { RootState } from "../store";
import * as Notifications from "expo-notifications";

/* ============================================================
   Helper — ensure profile exists
============================================================ */
async function ensureProfile(userId: string, email: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profile) return profile;

  // Create missing profile row
  const username = email.split("@")[0];

  const { data: created } = await supabase
    .from("profiles")
    .insert([
      {
        id: userId,
        username,
        avatar_url: null,
        expo_push_token: null,
      },
    ])
    .select()
    .single();

  return created;
}

/* ============================================================
   FETCH PROFILE
============================================================ */
export const fetchUserProfile = createAsyncThunk(
  "user/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return rejectWithValue("Not logged in");

    const profile = await ensureProfile(user.id, user.email!);

    return {
      user,
      username: profile.username ?? "",
      avatar_url: profile.avatar_url ?? null,
      role: user.user_metadata?.role ?? "student",
      expoPushToken: profile.expo_push_token ?? null,
    };
  }
);

/* ============================================================
   UPDATE USERNAME
============================================================ */
export const updateUsername = createAsyncThunk(
  "user/updateUsername",
  async (username: string, { rejectWithValue }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return rejectWithValue("Not logged in");

    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    if (error) return rejectWithValue(error.message);

    return username;
  }
);

/* ============================================================
   UPDATE AVATAR URL
============================================================ */
export const updateAvatarUrl = createAsyncThunk(
  "user/updateAvatarUrl",
  async (avatar_url: string, { rejectWithValue }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return rejectWithValue("Not logged in");

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url })
      .eq("id", user.id);

    if (error) return rejectWithValue(error.message);

    return avatar_url;
  }
);

/* ============================================================
   SAVE EXPO PUSH TOKEN
   (call this from a component after you get the token)
============================================================ */
export const saveExpoPushToken = createAsyncThunk(
  "user/saveExpoPushToken",
  async (expoPushToken: string, { rejectWithValue }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return rejectWithValue("Not logged in");

    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: expoPushToken })
      .eq("id", user.id);

    if (error) return rejectWithValue(error.message);

    return expoPushToken;
  }
);

/* ============================================================
   SIGNUP
============================================================ */
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
        data: { role },
        emailRedirectTo: "uconnect://", // ← redirect to home screen
      },
    });

    if (error) return rejectWithValue(error.message);

    if (data.user) {
      await ensureProfile(data.user.id, email);
    }

    return {
      user: data.user,
      role,
      username: email.split("@")[0],
      avatar_url: null,
      expoPushToken: null,
    };
  }
);

/* ============================================================
   LOGIN
============================================================ */
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
    if (!user) return rejectWithValue("Login failed");

    const profile = await ensureProfile(user.id, email);

    return {
      user,
      role: user.user_metadata?.role ?? "student",
      username: profile.username ?? "",
      avatar_url: profile.avatar_url ?? null,
      expoPushToken: profile.expo_push_token ?? null,
    };
  }
);

/* ============================================================
   LOGOUT
============================================================ */
export const logoutUser = createAsyncThunk("user/logoutUser", async () => {
  await supabase.auth.signOut();
});

/* ============================================================
   SLICE
============================================================ */
const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null as any,
    role: null as "student" | "organizer" | null,
    username: "",
    avatar_url: null as string | null,
    expoPushToken: null as string | null,
    status: "idle" as "idle" | "loading" | "succeeded" | "failed",
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* LOGIN */
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.username = action.payload.username;
        state.avatar_url = action.payload.avatar_url;
        state.expoPushToken = action.payload.expoPushToken ?? null;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

      /* SIGNUP */
      .addCase(signupUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.username = action.payload.username;
        state.avatar_url = action.payload.avatar_url;
        state.expoPushToken = action.payload.expoPushToken ?? null;
        state.status = "succeeded";
      })

      /* LOGOUT */
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.role = null;
        state.username = "";
        state.avatar_url = null;
        state.expoPushToken = null;
        state.status = "idle";
      })

      /* FETCH PROFILE */
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.username = action.payload.username;
        state.avatar_url = action.payload.avatar_url;
        state.expoPushToken = action.payload.expoPushToken ?? null;
      })

      /* UPDATE USERNAME */
      .addCase(updateUsername.fulfilled, (state, action) => {
        state.username = action.payload;
      })

      /* UPDATE AVATAR */
      .addCase(updateAvatarUrl.fulfilled, (state, action) => {
        state.avatar_url = action.payload;
      })

      /* SAVE EXPO PUSH TOKEN */
      .addCase(saveExpoPushToken.fulfilled, (state, action) => {
        state.expoPushToken = action.payload;
      });
  },
});

export default userSlice.reducer;

/* ============================================================
   SELECTORS
============================================================ */
export const selectUser = (state: RootState) => state.user.user;
export const selectIsAuthed = (state: RootState) => Boolean(state.user.user);
export const selectRole = (state: RootState) => state.user.role;
export const selectUsername = (state: RootState) => state.user.username;
export const selectAvatarUrl = (state: RootState) => state.user.avatar_url;
export const selectUserStatus = (state: RootState) => state.user.status;
export const selectUserError = (state: RootState) => state.user.error;
export const selectExpoPushToken = (state: RootState) =>
  state.user.expoPushToken;
