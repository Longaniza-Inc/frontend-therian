import type { CapacitorConfig } from "@capacitor/cli";

// Leer variables de entorno con fallbacks
const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
const APP_URL_DEV = process.env.VITE_APP_URL_DEV || "http://192.168.1.100:8080";
const APP_DEEPLINK_SCHEME = process.env.VITE_APP_DEEPLINK_SCHEME || "pawtalk";
const APP_URL_PROD = process.env.VITE_APP_URL_PROD || "https://pawtalk.app";

// Determinar si es desarrollo o producción
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.VITE_BUILD;
const appUrl = isDevelopment ? APP_URL_DEV : APP_URL_PROD;

const config: CapacitorConfig = {
  appId: "com.pawtalk.app",
  appName: "PawTalk",
  webDir: "dist",
  // En desarrollo, apunta al servidor local de Vite
  // En producción, carga desde el filesystem
  server: isDevelopment
    ? {
        url: appUrl,
        cleartext: true,
        androidScheme: "http",
      }
    : undefined,
  android: {
    allowMixedContent: isDevelopment, // Permitir HTTP en desarrollo
    captureInput: true,
    webContentsDebuggingEnabled: isDevelopment,
    // Deep links se configuran en AndroidManifest.xml, no aquí
  },
  ios: {
    contentInset: "always",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
