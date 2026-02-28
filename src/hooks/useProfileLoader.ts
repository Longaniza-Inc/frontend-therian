import { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "./useAppDispatch";
import { setMyProfile, setLoading, setError } from "@/store/slices/userSlice";
import { userService } from "@/services/userService";

/**
 * Hook que carga el perfil del usuario autenticado una sola vez y lo
 * guarda en Redux. Si el perfil ya está cacheado (profileLoaded = true),
 * no vuelve a llamar al backend.
 *
 * Se ejecuta al montar y cada vez que cambia `userId` o `isAuthenticated`.
 */
export function useProfileLoader() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, userId } = useAppSelector((s) => s.auth);
  const { profileLoaded } = useAppSelector((s) => s.user);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Solo cargar si está autenticado, tiene userId y no está cacheado
    if (!isAuthenticated || !userId || profileLoaded || loadingRef.current) return;

    const load = async () => {
      loadingRef.current = true;
      dispatch(setLoading(true));
      try {
        console.log("📦 useProfileLoader — cargando perfil para userId:", userId);
        const profile = await userService.obtenerPerfil(userId);
        dispatch(setMyProfile(profile));
        console.log("✅ Perfil cacheado en Redux:", profile);
      } catch (err: any) {
        console.error("❌ useProfileLoader — error:", err);
        dispatch(setError(err.message || "Error cargando perfil"));
      } finally {
        loadingRef.current = false;
      }
    };

    load();
  }, [isAuthenticated, userId, profileLoaded, dispatch]);
}
