import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Hook que maneja deep links en la app mobile
 * 
 * Soporta los siguientes patrones:
 * - pawtalk://auth/callback?token=abc123 → /auth/callback?token=abc123
 * - pawtalk://chat/123 → /chat/123 (abre chat específico)
 * - pawtalk://new-match → / (feed, nuevo match disponible)
 * - pawtalk://notification?type=message&chatId=456 → maneja notificaciones
 */
export function useDeepLink() {
  const navigate = useNavigate();

  useEffect(() => {
    // Solo en plataforma nativa
    if (!Capacitor.isNativePlatform()) return;

    const handleAppUrl = (event: URLOpenListenerEvent) => {
      console.log("🔗 Deep link recibido:", event.url);

      try {
        // El deeplink viene como: pawtalk://auth/callback?authData=...
        // Extraer la parte después de pawtalk://
        const urlString = event.url.replace("pawtalk://", "");
        const [pathname, search] = urlString.includes("?") 
          ? urlString.split("?") 
          : [urlString, ""];
        const fullPathname = `/${pathname}`;
        const searchStr = search ? `?${search}` : "";

        console.log("📍 Ruta parseada:", fullPathname, searchStr);

        // Parsear el deep link según el patrón
        // pawtalk://auth/callback?... → /auth/callback?...
        // pawtalk://chat/123 → /chat/123
        // pawtalk://new-match → /
        // pawtalk://notification?type=message&chatId=456 → /chat/456

        if (fullPathname === "/auth/callback") {
          navigate(`${fullPathname}${searchStr}`);
          console.log("✅ Navegando a auth callback");
        } else if (fullPathname === "/chat" || fullPathname.startsWith("/chat/")) {
          // Extraer chat ID si existe: /chat/123
          navigate(`${fullPathname}${searchStr}`);
          console.log("✅ Navegando a chat:", fullPathname);
        } else if (fullPathname === "/new-match") {
          // Nuevo match → navegar al feed
          navigate("/");
          console.log("✅ Navegando a feed (nuevo match disponible)");
        } else if (fullPathname === "/notification") {
          // Manejar notificaciones genéricas
          const urlParams = new URLSearchParams(searchStr);
          const type = urlParams.get("type");
          const chatId = urlParams.get("chatId");

          if (type === "message" && chatId) {
            navigate(`/chat/${chatId}`);
            console.log("✅ Navegando a chat desde notificación:", chatId);
          } else if (type === "match") {
            navigate("/");
            console.log("✅ Navegando a feed desde notificación de match");
          }
        } else if (fullPathname) {
          // Fallback: navegar a la ruta como está
          navigate(`${fullPathname}${searchStr}`);
          console.log("✅ Navegando a ruta genérica:", fullPathname);
        }
      } catch (error) {
        console.error("❌ Error procesando deep link:", error);
      }
    };

    let listenerPromise: Promise<any> | null = null;

    const setupDeepLinks = async () => {
      try {
        // Listener para deep links mientras la app está abierta
        listenerPromise = App.addListener("appUrlOpen", handleAppUrl);

        // También manejar la URL si la app se abre desde un deep link
        // Nota: getInitialUrl no existe en la versión 8.x, usar appUrlOpen con delay
        // o usar App.getLaunchUrl() si está disponible
      } catch (error) {
        console.error("Error setting up deep link listener:", error);
      }
    };

    setupDeepLinks();

    return () => {
      if (listenerPromise) {
        listenerPromise.then((handle) => {
          if (handle && typeof handle.remove === "function") {
            handle.remove();
          }
        });
      }
    };
  }, [navigate]);
}
