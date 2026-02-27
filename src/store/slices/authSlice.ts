import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthTokens } from "@/types";

interface AuthState {
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  userId: number | null;
  googleId: string | null;
  email: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  tokens: null,
  userId: null,
  googleId: null,
  email: null,
  loading: false,
  error: null,
};

// Recuperar estado inicial desde localStorage
const loadAuthFromStorage = (): AuthState => {
  try {
    const stored = localStorage.getItem("auth_state");
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("📦 Auth state recuperado de localStorage:", {
        isAuthenticated: parsed.isAuthenticated,
        has_tokens: !!parsed.tokens,
        userId: parsed.userId,
        email: parsed.email,
      });
      return parsed;
    }
  } catch (error) {
    console.error("❌ Error recuperando auth state:", error);
  }
  return initialState;
};

// Guardar estado a localStorage
const saveAuthToStorage = (state: AuthState) => {
  try {
    localStorage.setItem("auth_state", JSON.stringify({
      isAuthenticated: state.isAuthenticated,
      tokens: state.tokens,
      userId: state.userId,
      googleId: state.googleId,
      email: state.email,
    }));
  } catch (error) {
    console.error("❌ Error guardando auth state:", error);
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadAuthFromStorage(),
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setTokens(state, action: PayloadAction<AuthTokens & { userId?: number }>) {
      state.tokens = {
        accessToken: action.payload.accessToken,
        tokenType: action.payload.tokenType,
        refreshToken: action.payload.refreshToken,
      };
      if (action.payload.userId) {
        state.userId = action.payload.userId;
      }
      state.isAuthenticated = true;
      state.error = null;
      saveAuthToStorage(state);
      console.log("✅ Tokens guardados en localStorage");
    },
    setGoogleInfo(state, action: PayloadAction<{ googleId: string; email: string; userId?: number }>) {
      state.googleId = action.payload.googleId;
      state.email = action.payload.email;
      if (action.payload.userId) {
        state.userId = action.payload.userId;
      }
      saveAuthToStorage(state);
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.tokens = null;
      state.userId = null;
      state.googleId = null;
      state.email = null;
      state.error = null;
      localStorage.removeItem("auth_state");
      console.log("✅ Auth state limpiada de localStorage");
    },
  },
});

export const { setLoading, setTokens, setGoogleInfo, setError, logout } = authSlice.actions;
export default authSlice.reducer;
