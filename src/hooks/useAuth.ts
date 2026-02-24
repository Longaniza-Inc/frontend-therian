import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./useAppDispatch";
import { setLoading, setTokens, setGoogleInfo, setError, logout as logoutAction } from "@/store/slices/authSlice";
import { authService } from "@/services/authService";

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const loginWithGoogle = useCallback(async () => {
    try {
      console.log("🔐 Iniciando loginWithGoogle...");
      dispatch(setLoading(true));
      // Get Google login URL from backend
      console.log("🔐 Llamando authService.googleLogin()...");
      const url = await authService.googleLogin();
      console.log("🔐 URL received:", url);
      console.log("🔐 URL type:", typeof url);
      if (url) {
        console.log("🔐 Redirigiendo a:", url);
        window.location.href = url;
      } else {
        console.log("🔐 URL es null/undefined");
        dispatch(setError("No se recibió URL de Google"));
      }
    } catch (err: any) {
      console.error("🔐 Error en loginWithGoogle:", err);
      dispatch(setError(err.message || "Error al iniciar sesión con Google"));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleGoogleCallback = useCallback(async (params: Record<string, string>) => {
    try {
      dispatch(setLoading(true));
      const response = await authService.googleCallback(params);

      if (response.access_token) {
        dispatch(setTokens({ accessToken: response.access_token, tokenType: response.token_type || "bearer" }));
        return { isNewUser: false, response };
      } else if (response.resultado === "Usuario_aun_no_creado") {
        dispatch(setGoogleInfo({ googleId: response.id_google!, email: response.email! }));
        return { isNewUser: true, response };
      }
      return { isNewUser: false, response };
    } catch (err: any) {
      dispatch(setError(err.message || "Error en callback de Google"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const registerUser = useCallback(async (userData: string, images: File[]) => {
    try {
      dispatch(setLoading(true));
      const response = await authService.register(userData, images);
      if (response.access_token) {
        dispatch(setTokens({ accessToken: response.access_token, tokenType: response.token_type || "bearer" }));
      }
      return response;
    } catch (err: any) {
      dispatch(setError(err.message || "Error al registrarse"));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  return {
    ...auth,
    loginWithGoogle,
    handleGoogleCallback,
    registerUser,
    logout,
  };
}
