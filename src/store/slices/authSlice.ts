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
  isInitializing: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  tokens: null,
  userId: null,
  googleId: null,
  email: null,
  loading: false,
  error: null,
  isInitializing: true,
};

// Recuperar estado inicial desde localStorage
const loadAuthFromStorage = (): AuthState => {
  try {
    const stored = localStorage.getItem("auth_state");
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("📦 [authSlice] Auth state recuperado de localStorage:", {
        isAuthenticated: parsed.isAuthenticated,
        has_tokens: !!parsed.tokens,
        tokenLength: parsed.tokens?.accessToken?.length || 0,
        tokenPreview: parsed.tokens?.accessToken ? parsed.tokens.accessToken.substring(0, 30) + "..." : "NO TOKEN",
        userId: parsed.userId,
        email: parsed.email,
      });
      // IMPORTANTE: isInitializing SIEMPRE comienza como true para validar token
      console.log("🔐 [authSlice] Forzando isInitializing: true para validar sesión");
      return {
        ...parsed,
        isInitializing: true,
      };
    }
  } catch (error) {
    console.error("❌ [authSlice] Error recuperando auth state:", error);
  }
  console.log("📦 [authSlice] Sin auth state en localStorage, usando initialState");
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
      // IMPORTANTE: NO guardar isInitializing, siempre debe ser true al cargar
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
    setInitializationComplete(state) {
      console.log("🔐 [authSlice] setInitializationComplete - isInitializing: true → false");
      state.isInitializing = false;
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
      console.log("✅ Tokens guardados en localStorage:", {
        accessTokenLength: action.payload.accessToken.length,
        accessTokenPreview: action.payload.accessToken.substring(0, 30) + "...",
        tokenType: action.payload.tokenType,
        hasRefreshToken: !!action.payload.refreshToken,
        userId: action.payload.userId,
      });
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

export const { setLoading, setInitializationComplete, setTokens, setGoogleInfo, setError, logout } = authSlice.actions;
export default authSlice.reducer;
