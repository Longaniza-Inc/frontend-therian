import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  appType: 'spa',  // Configurar como Single Page Application
  server: {
    host: "localhost",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/auth/": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        credentials: "include",
        bypass(req) {
          // No proxear /auth/callback — es una ruta del frontend
          if (req.url.startsWith("/auth/callback")) {
            return req.url;
          }
        },
      },
      "/feed/": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        credentials: "include",
      },
      "/likes/": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        credentials: "include",
      },
      "/usuario/": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        credentials: "include",
      },
      "/chat/": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        credentials: "include",
        ws: true,  // Enable WebSocket proxying
        rewriteWsUpgradeUri: true,  // Reescribir protocolo ws -> wss en desarrollo
      },
      "/etiquetas/": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        credentials: "include",
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
