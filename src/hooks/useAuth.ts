import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppDispatch, useAppSelector } from "./useAppDispatch";
import { setLoading, setTokens, setGoogleInfo, setError, logout as logoutAction } from "@/store/slices/authSlice";
import { clearProfile } from "@/store/slices/userSlice";
import { clearChats } from "@/store/slices/chatSlice";
import { clearFeed } from "@/store/slices/feedSlice";
import { authService } from "@/services/authService";
import { decodeJWT } from "@/lib/jwt";
import {
  requestNotificationPermission,
  getFCMToken,
  getCachedFCMToken,
  setupPushListeners,
  removePushListeners,
} from "@/services/pushNotificationService";

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  /**
   * Inicializa push notifications tras un login/registro exitoso.
   * Pide permisos, obtiene token FCM, lo envía al backend y configura listeners.
   */
  const initPushAfterAuth = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        console.log("⚠️ Permisos de notificación no concedidos");
        return;
      }

      const fcmToken = await getFCMToken();
      if (fcmToken) {
        // Registrar token en backend (por si no se envió en el login)
        await authService.updateFCMToken(fcmToken);
      }

      // Configurar listeners para foreground notifications
      setupPushListeners({
        onNotificationReceived: (notification) => {
          console.log("📬 Notificación foreground:", notification);
        },
        onNotificationClicked: (notification) => {
          console.log("👆 Click en notificación:", notification);
          // Deep links se manejan en useDeepLink via App plugin
        },
        // Nota: El token refresh es manejado internamente por Firebase en Android.
        // Si se necesita sincronizar una nueva token, usar authService.updateFCMToken()
      });
    } catch (error) {
      console.error("⚠️ Error inicializando push:", error);
    }
  }, []);

  /** Login directo con id_token de Google (para Google SDK) */
  const googleAuth = useCallback(async (idToken: string) => {
    try {
      console.log("🔐 googleAuth - Enviando id_token...");
      dispatch(setLoading(true));

      // Obtener FCM token antes del login para enviarlo junto con la auth
      let fcmToken: string | null = null;
      if (Capacitor.isNativePlatform()) {
        const granted = await requestNotificationPermission();
        if (granted) fcmToken = await getFCMToken();
      }

      const response = await authService.googleAuth(idToken, fcmToken ?? undefined);

      console.log("📋 Respuesta del backend (googleAuth):", {
        user_id: response.user_id,
        google_id: response.user?.google_id || response.google_id,
        email: response.email,
        access_token: !!response.access_token,
      });

      if (response.access_token) {
        // Usuario existente - devuelve tokens completos
        console.log("✅ Usuario existente, guardando tokens...");
        
        // Decodificar JWT para verificar expiración
        console.log("🔍 Decodificando JWT recibido...");
        decodeJWT(response.access_token);
        
        // IMPORTANTE: Usar user_id de la BD, NO google_id
        const userId = response.user?.id || response.user_id;
        console.log("🆔 Usando user_id:", userId);
        
        dispatch(setTokens({
          accessToken: response.access_token,
          tokenType: response.token_type || "bearer",
          refreshToken: response.refresh_token,
          userId: userId,
        }));
        dispatch(setGoogleInfo({
          googleId: response.user?.google_id || response.google_id || "",
          email: response.user?.email || response.email || "",
          userId: userId,
        }));
        // Inicializar push notifications (listeners + token refresh)
        initPushAfterAuth();
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
      
      // Detectar si es plataforma mobile (Capacitor nativa) o web
      const clientType = Capacitor.isNativePlatform() ? "mobile" : "web";
      console.log("📱 Client type:", clientType);
      
      const url = await authService.googleLogin(clientType);
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
        user_id: response.user_id,
        google_id: response.google_id,
        has_token: !!response.access_token,
      });

      if (response.access_token) {
        // Usuario existente
        console.log("✅ Usuario existente + tokens");
        
        // Decodificar JWT para verificar expiración
        console.log("🔍 Decodificando JWT recibido en callback...");
        decodeJWT(response.access_token);
        
        // IMPORTANTE: Usar user_id de la BD, NO google_id
        const userId = response.user_id;
        console.log("🆔 Usando user_id:", userId);
        
        dispatch(setTokens({
          accessToken: response.access_token,
          tokenType: response.token_type || "bearer",
          refreshToken: response.refresh_token,
          userId: userId,
        }));
        dispatch(setGoogleInfo({
          googleId: response.google_id,
          email: response.email,
          userId: userId,
        }));
        // Inicializar push notifications (listeners + token refresh)
        initPushAfterAuth();
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
      
      console.log("📋 Respuesta del backend (register):", {
        user_id: response.user?.id,
        google_id: response.user?.google_id,
        email: response.user?.email,
        has_token: !!response.access_token,
      });
      
      if (response.access_token) {
        // IMPORTANTE: Usar user_id de la BD, NO google_id
        const userId = response.user?.id;
        console.log("🆔 Usando user_id:", userId);
        
        dispatch(setTokens({
          accessToken: response.access_token,
          tokenType: response.token_type || "bearer",
          refreshToken: response.refresh_token,
          userId: userId,
        }));
        dispatch(setGoogleInfo({
          googleId: response.user?.google_id || "",
          email: response.user?.email || "",
          userId: userId,
        }));
      }
      // Inicializar push notifications tras registro
      initPushAfterAuth();
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
      
      // Obtener FCM token cacheado para desactivarlo en backend
      const fcmToken = getCachedFCMToken();
      
      if (refreshToken) {
        await authService.logout(refreshToken, fcmToken ?? undefined);
      }
      
      // Limpiar listeners de push notifications
      await removePushListeners();
      
      dispatch(clearProfile());
      dispatch(clearChats());
      dispatch(clearFeed());
      dispatch(logoutAction());
    } catch (err: any) {
      console.error("Error al logout:", err);
      await removePushListeners();
      dispatch(clearProfile());
      dispatch(clearChats());
      dispatch(clearFeed());
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
    initPushAfterAuth,
  };
}
