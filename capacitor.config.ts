import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.longanizainc.pawtalk",
  appName: "PawTalk",
  webDir: "dist",
  // App embebida: carga desde los archivos en dist/ (copiados al APK)
  // NO usar server.url — eso haría que cargue desde un servidor externo
  server: {
    androidScheme: "https", // Capacitor default, necesario para cookies seguras
  },
  android: {
    allowMixedContent: true, // Permitir HTTP para el backend (VPS sin HTTPS)
    captureInput: true,
    webContentsDebuggingEnabled: true, // Desactivar en release final
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
