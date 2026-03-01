import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import App from "./App.tsx";
import "./index.css";

// Inicializar plugins de Capacitor solo en entorno nativo
if (Capacitor.isNativePlatform()) {
  // Status bar: fondo blanco, iconos oscuros
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(() => {});
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

  // Keyboard: no mover el body cuando aparece el teclado (lo maneja el CSS)
  Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
