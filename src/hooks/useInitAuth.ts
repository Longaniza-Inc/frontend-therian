import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppDispatch, useAppSelector } from "./useAppDispatch";
import { authService } from "@/services/authService";
import { setTokens, setInitializationComplete, logout as logoutAction } from "@/store/slices/authSlice";
import { decodeJWT } from "@/lib/jwt";
import { getFCMToken } from "@/services/pushNotificationService";

/**
 * Hook que valida la sesión al cargar la app.
 * - Si el token está expirado, intenta refrescarlo
 * - Si el refresh falla, hace logout
 * - Si el token es válido, no hace nada
 * - Sincroniza el token FCM con el backend (por si cambió en background)
 */
export const useInitAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    console.log("🔐 [useInitAuth] INICIANDO - isAuthenticated:", auth.isAuthenticated, "hasToken:", !!auth.tokens?.accessToken);

    // Si no hay sesión almacenada, terminar la inicialización inmediatamente
    if (!auth.isAuthenticated || !auth.tokens?.accessToken) {
      console.log("🔐 [useInitAuth] ❌ No hay sesión almacenada, completando inicialización sin validar");
      dispatch(setInitializationComplete());
      return;
    }

    console.log("🔐 [useInitAuth] ✅ Sesión encontrada, iniciando validación de token...");

    const validateAndRefreshToken = async () => {
      try {
        console.log("🔐 [useInitAuth] Decodificando token...");
        // Decodificar JWT para verificar expiración
        const decoded = decodeJWT(auth.tokens!.accessToken);

        if (!decoded || !decoded.exp) {
          console.warn("⚠️ [useInitAuth] No se pudo decodificar JWT, manteniendo sesión activa");
          // No hacer logout — el token puede ser válido pero sin campo exp
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        const expiresIn = decoded.exp - now;

        console.log(`🔐 [useInitAuth] Token expira en: ${expiresIn}s (exp: ${decoded.exp}, now: ${now})`);

        // Si el token expira en menos de 5 minutos, intentar refrescar
        if (expiresIn < 300) {
          console.log("⏰ [useInitAuth] Token próximo a expirar, intentando refrescar...");
          const refreshToken = auth.tokens?.refreshToken;
          
          if (!refreshToken) {
            console.error("❌ [useInitAuth] No hay refresh token disponible, haciendo logout");
            dispatch(logoutAction());
            return;
          }

          try {
            console.log("🔐 [useInitAuth] Enviando refresh token al backend...");
            const response = await authService.refreshToken(refreshToken);
            console.log("✅ [useInitAuth] Token refrescado correctamente");
            dispatch(setTokens({
              accessToken: response.access_token,
              tokenType: response.token_type || "bearer",
              refreshToken: response.refresh_token || refreshToken,
              userId: auth.userId || undefined,
            }));
          } catch (err) {
            console.error("❌ [useInitAuth] Error refrescando token:", err);
            dispatch(logoutAction());
          }
        } else {
          console.log("✅ [useInitAuth] Token válido, no requiere refresh");
        }
      } catch (err) {
        console.error("❌ [useInitAuth] Error inesperado validando token:", err);
        // Solo hacer logout si realmente no podemos validar nada
        dispatch(logoutAction());
      }
    };

    const syncFCMToken = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        console.log("🔄 [useInitAuth] Sincronizando token FCM con el backend...");
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          await authService.updateFCMToken(fcmToken);
          console.log("✅ [useInitAuth] Token FCM sincronizado con el backend");
        }
      } catch (err) {
        console.warn("⚠️ [useInitAuth] No se pudo sincronizar token FCM:", err);
        // No lanzar error, continuar normalmente
      }
    };

    // Ejecutar ambas operaciones en paralelo
    console.log("🔐 [useInitAuth] Iniciando validación y sincronización...");
    Promise.all([validateAndRefreshToken(), syncFCMToken()])
      .catch(err => {
        console.error("❌ [useInitAuth] Error en inicialización:", err);
      })
      .finally(() => {
        // Marcar que la inicialización terminó (éxito o error)
        console.log("✅ [useInitAuth] COMPLETADO - marcando isInitializing: false");
        dispatch(setInitializationComplete());
      });
  }, [auth.isAuthenticated, auth.tokens, auth.userId, dispatch]);
};
