import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./useAppDispatch";
import { setLoading, setTokens, setGoogleInfo, setError, logout as logoutAction } from "@/store/slices/authSlice";
import { authService } from "@/services/authService";

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  /** Login directo con id_token de Google (para Google SDK) */
  const googleAuth = useCallback(async (idToken: string) => {
    try {
      console.log("🔐 googleAuth - Enviando id_token...");
      dispatch(setLoading(true));
      const response = await authService.googleAuth(idToken);

      if (response.access_token) {
        // Usuario existente - devuelve tokens completos
        console.log("✅ Usuario existente, guardando tokens...");
        dispatch(setTokens({
          accessToken: response.access_token,
          tokenType: response.token_type || "bearer",
          refreshToken: response.refresh_token,
          userId: response.user?.id || response.user_id,
        }));
        dispatch(setGoogleInfo({
          googleId: response.user?.google_id || response.google_id || "",
          email: response.user?.email || response.email || "",
          userId: response.user?.id || response.user_id,
        }));
        return { isNewUser: false, response };
      } else if (response.is_new_user) {
        // Usuario nuevo - solo datos básicos
        console.log("✅ Usuario nuevo, guardando info...");
        dispatch(setGoogleInfo({
          googleId: response.google_id,
          email: response.email,
        }));
        return { isNewUser: true, response };
      }
      return { isNewUser: false, response };
    } catch (err: any) {
      dispatch(setError(err.message || "Error en Google Auth"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /** Login con OAuth redirect (GET /auth/google/login) */
  const loginWithGoogle = useCallback(async () => {
    try {
      console.log("🔐 loginWithGoogle...");
      dispatch(setLoading(true));
      const url = await authService.googleLogin();
      if (url) {
        console.log("🔐 Redirigiendo a:", url);
        window.location.href = url;
      } else {
        dispatch(setError("No se recibió URL de Google"));
      }
    } catch (err: any) {
      console.error("🔐 Error:", err);
      dispatch(setError(err.message || "Error al iniciar sesión"));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /** Procesar datos recibidos en localStorage tras callback de Google */
  const handleGoogleCallback = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const authDataStr = localStorage.getItem("authData");
      const authError = localStorage.getItem("authError");

      if (authError) {
        throw new Error(authError);
      }

      if (!authDataStr) {
        throw new Error("No se encontraron datos de autenticación");
      }

      const response = JSON.parse(authDataStr);
      console.log("✅ Datos de callback parseados:", {
        is_new_user: response.is_new_user,
        email: response.email,
        has_token: !!response.access_token,
      });

      if (response.access_token) {
        // Usuario existente
        console.log("✅ Usuario existente + tokens");
        dispatch(setTokens({
          accessToken: response.access_token,
          tokenType: response.token_type || "bearer",
          refreshToken: response.refresh_token,
          userId: response.user_id,
        }));
        dispatch(setGoogleInfo({
          googleId: response.google_id,
          email: response.email,
          userId: response.user_id,
        }));
        return { isNewUser: false, response };
      } else if (response.is_new_user) {
        // Usuario nuevo
        console.log("✅ Usuario nuevo, completar perfil");
        dispatch(setGoogleInfo({
          googleId: response.google_id,
          email: response.email,
        }));
        return { isNewUser: true, response };
      }

      throw new Error("Respuesta de callback inválida");
    } catch (err: any) {
      console.error("❌ Error:", err);
      dispatch(setError(err.message || "Error procesando autenticación"));
      throw err;
    } finally {
      localStorage.removeItem("authData");
      localStorage.removeItem("authError");
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const registerUser = useCallback(async (userData: string, images: File[]) => {
    try {
      dispatch(setLoading(true));
      const response = await authService.register(userData, images);
      
      if (response.access_token) {
        dispatch(setTokens({
          accessToken: response.access_token,
          tokenType: response.token_type || "bearer",
          refreshToken: response.refresh_token,
          userId: response.user?.id,
        }));
        dispatch(setGoogleInfo({
          googleId: response.user?.google_id || "",
          email: response.user?.email || "",
          userId: response.user?.id,
        }));
      }
      return response;
    } catch (err: any) {
      dispatch(setError(err.message || "Error al registrarse"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const refreshToken = auth.tokens?.refreshToken;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      dispatch(logoutAction());
    } catch (err: any) {
      console.error("Error al logout:", err);
      dispatch(logoutAction()); // Logout local anyway
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, auth.tokens?.refreshToken]);

  return {
    ...auth,
    googleAuth,
    loginWithGoogle,
    handleGoogleCallback,
    registerUser,
    logout,
  };
}
