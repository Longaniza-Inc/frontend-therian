import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile } from "@/types";

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile>) {
      state.profile = action.payload;
      state.loading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearProfile(state) {
      state.profile = null;
    },
  },
});

export const { setProfile, setLoading, setError, clearProfile } = userSlice.actions;
export default userSlice.reducer;
