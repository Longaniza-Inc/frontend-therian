import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { verificarActualizacion } from "@/services/remoteConfigService";

// Versión actual de la app - Obtiene el valor desde variables de entorno
// Debe coincidir con versionName en android/app/build.gradle
const VERSION_ACTUAL = import.meta.env.VITE_APP_VERSION || "1.3";

/**
 * Hook para verificar si la app necesita actualización obligatoria
 * Solo se ejecuta en plataformas nativas (Android/iOS)
 */
export const useVersionCheck = () => {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkVersion = async () => {
      // Solo verificar en plataformas nativas
      if (!Capacitor.isNativePlatform()) {
        console.log("🌐 Plataforma web - omitiendo verificación de versión");
        setChecking(false);
        return;
      }

      try {
        console.log("🔍 Verificando versión de la app...");
        console.log("📱 Versión actual:", VERSION_ACTUAL);
        
        const requiresUpdate = await verificarActualizacion(VERSION_ACTUAL);
        
        if (requiresUpdate) {
          console.log("⚠️ La app necesita actualización");
          setNeedsUpdate(true);
        } else {
          console.log("✅ La app está actualizada");
          setNeedsUpdate(false);
        }
      } catch (error) {
        console.error("❌ Error verificando versión:", error);
        // En caso de error, permitir que continúe (no bloquear la app)
        setNeedsUpdate(false);
      } finally {
        setChecking(false);
      }
    };

    checkVersion();
  }, []);

  return { needsUpdate, checking };
};
