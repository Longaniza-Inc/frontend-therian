import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthTokens } from "@/types";

interface AuthState {
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  googleId: string | null;
  email: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  tokens: null,
  googleId: null,
  email: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setTokens(state, action: PayloadAction<AuthTokens>) {
      state.tokens = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    setGoogleInfo(state, action: PayloadAction<{ googleId: string; email: string }>) {
      state.googleId = action.payload.googleId;
      state.email = action.payload.email;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.tokens = null;
      state.googleId = null;
      state.email = null;
      state.error = null;
    },
  },
});

export const { setLoading, setTokens, setGoogleInfo, setError, logout } = authSlice.actions;
export default authSlice.reducer;
