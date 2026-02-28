import React, { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppDispatch";
import { chatService } from "@/services/chatService";
import type { Mensaje } from "@/services/chatService";
import {
  addMessage,
  updateChatPreview,
  clearChats,
  addActiveChatId,
  invalidateChatList,
} from "@/store/slices/chatSlice";

/* ═══════════════════════════════════════
   CONTEXT TYPES
   ═══════════════════════════════════════ */

interface WebSocketContextValue {
  /** Asegura que el WS para un chat esté abierto (idempotente) */
  ensureChatWs: (chatId: number) => void;
  /** Enviar mensaje por el WS de un chat */
  sendMessage: (chatId: number, contenido: string) => void;
  /** Verificar si un chat tiene WS abierto */
  isChatConnected: (chatId: number) => boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  ensureChatWs: () => {},
  sendMessage: () => {},
  isChatConnected: () => false,
});

export const useWebSocket = () => useContext(WebSocketContext);

/* ═══════════════════════════════════════
   PROVIDER
   ═══════════════════════════════════════ */

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Map de WebSockets: chatId → WebSocket
  const chatWsMap = useRef<Map<number, WebSocket>>(new Map());
  // WS global de notificaciones
  const notifWsRef = useRef<WebSocket | null>(null);
  // Reconnect state para notificaciones
  const notifReconnect = useRef(0);
  const notifConnecting = useRef(false);
  const MAX_RECONNECT = 5;

  /* ── HELPERS ────────────────────────────────────────────── */

  const buildWsUrl = useCallback((path: string, token: string) => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${proto}//${host}${path}?token=${encodeURIComponent(token)}`;
  }, []);

  /* ── WS NOTIFICACIONES (global, siempre abierto) ───────── */

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.tokens?.accessToken) return;

    // Guard: ya hay conexión abierta o en curso
    if (notifConnecting.current) return;
    const existing = notifWsRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) return;

    notifConnecting.current = true;
    const token = auth.tokens.accessToken;

    const connect = () => {
      // Re-check antes de cada intento (timers pendientes)
      const cur = notifWsRef.current;
      if (cur && (cur.readyState === WebSocket.OPEN || cur.readyState === WebSocket.CONNECTING)) {
        notifConnecting.current = false;
        return;
      }

      const url = buildWsUrl("/chat/notifications", token);
      console.log("🔔 WS-Provider: abriendo notificaciones...");
      const ws = new WebSocket(url);
      notifWsRef.current = ws; // Set inmediato para que el guard funcione

      ws.onopen = () => {
        console.log("✅ WS-Provider: notificaciones CONECTADO");
        notifReconnect.current = 0;
        notifConnecting.current = false;
      };

      ws.onmessage = (ev) => {
        try {
          console.log("📨 WS-Notificaciones mensaje RAW:", ev.data);
          const data = JSON.parse(ev.data);
          console.log("📨 WS-Notificaciones parseado:", { 
            type: data.type, 
            keys: Object.keys(data),
            fullData: data 
          });
          
          if (data.type === "ping") {
            console.log("🏓 Respondiendo ping");
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          }
          
          // ✅ NUEVO CHAT (cuando hay un match)
          if (data.type === "new_chat") {
            console.log("🎉 ¡NUEVO CHAT DETECTADO! Disparando invalidateChatList...", data);
            dispatch(invalidateChatList());
            return;
          }
          
          // 🔄 REFRESH CHATS (instrucción explícita del backend para recargar)
          if (data.type === "refresh_chats") {
            console.log("🔄 Refresh chats recibido del backend - revalidando lista");
            dispatch(invalidateChatList());
            return;
          }
          
          // ✅ SYNC REQUIRED (cuando te reconectas, verifica si hay nuevos chats)
          if (data.type === "sync_required") {
            console.log("🔄 sync_required recibido - forzando reload de chats");
            dispatch(invalidateChatList());
            return;
          }
          
          // Actualización de chat existente
          if (data.type === "chat_update") {
            console.log("💬 Chat update recibido:", data);
            dispatch(updateChatPreview({
              chat_id: data.chat_id,
              ultimo_mensaje: data.ultimo_mensaje,
              id_emisor: data.id_emisor,
              timestamp: data.timestamp,
              unread_count: data.unread_count,
            }));
          }
          
          // Fallback: detectar si tiene estructura de nuevo chat aunque no tenga type
          if (data.id_chat && !data.type) {
            console.warn("⚠️ Mensaje sin type pero con estructura de chat, procesando...");
            dispatch(invalidateChatList());
          }
        } catch (err) {
          console.error("❌ Error parseando mensaje WS notificaciones:", err, "Raw:", ev.data);
        }
      };

      ws.onerror = (ev) => {
        console.error("⚠️ WS-Provider: notificaciones error", ev);
      };

      ws.onclose = (ev) => {
        console.log("🔌 WS-Provider: notificaciones cerrado", ev.code);
        if (notifWsRef.current === ws) notifWsRef.current = null;
        notifConnecting.current = false;
        // Reconectar en: cierres anormales (1006), restart del servidor (1012), timeout (1011), etc.
        // NO reconectar solo en: 1000 (normal), 1001 (going away), 1008 (policy violation)
        const shouldReconnect = ![1000, 1001, 1008].includes(ev.code);
        if (shouldReconnect && notifReconnect.current < MAX_RECONNECT) {
          notifReconnect.current++;
          notifConnecting.current = true;
          const delay = Math.pow(2, notifReconnect.current) * 1000;
          console.log(`↻ WS-Provider: reconectando notificaciones en ${delay}ms (intento ${notifReconnect.current}/${MAX_RECONNECT})`);
          setTimeout(connect, delay);
        }
      };
    };

    connect();

    // NO cerrar en cleanup — el WS persiste toda la sesión.
    // El efecto de logout (abajo) se encarga de cerrar.
  }, [auth.isAuthenticated, auth.tokens?.accessToken, buildWsUrl, dispatch]);

  /* ── WS PER-CHAT (abre una vez, persiste toda la sesión) ── */

  const ensureChatWs = useCallback((chatId: number) => {
    if (!auth.tokens?.accessToken) return;

    // Si ya existe y está abierto → skip
    const existing = chatWsMap.current.get(chatId);
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = auth.tokens.accessToken;
    const url = buildWsUrl(`/chat/ws/${chatId}`, token);
    console.log("🔌 WS-Provider: abriendo chat WS:", chatId);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("✅ WS-Provider: chat", chatId, "CONECTADO");
      chatWsMap.current.set(chatId, ws);
      dispatch(addActiveChatId(chatId));
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }
        if (data.type === "pong") return;

        // new_message o cualquier frame con contenido
        if (data.type === "new_message" || data.contenido) {
          const msg: Mensaje = {
            id_mensaje: data.id_mensaje,
            chat_id: data.chat_id ?? chatId,
            id_emisor: data.id_emisor,
            contenido: data.contenido,
            fecha: data.fecha,
            esLeido: data.esLeido,
          };
          dispatch(addMessage({ chatId, mensaje: msg }));
        }
      } catch { /* ignore bad frames */ }
    };

    ws.onerror = (ev) => {
      console.error("⚠️ WS-Provider: chat", chatId, "error", ev);
    };

    ws.onclose = (ev) => {
      console.log("🔌 WS-Provider: chat", chatId, "cerrado", ev.code);
      chatWsMap.current.delete(chatId);
      // Reconectar en cierres anormales (1006=abnormal, 1012=service restart, etc.)
      // NO reconectar en cierres normales (1000=ok, 1001=going away, 1008=policy)
      const shouldReconnect = ![1000, 1001, 1008].includes(ev.code);
      if (shouldReconnect && auth.isAuthenticated) {
        console.log(`↻ WS-Provider: reconectando chat ${chatId} en 3s...`);
        setTimeout(() => ensureChatWs(chatId), 3000);
      }
    };

    chatWsMap.current.set(chatId, ws);
  }, [auth.tokens?.accessToken, auth.isAuthenticated, buildWsUrl, dispatch]);

  const sendMessage = useCallback((chatId: number, contenido: string) => {
    const ws = chatWsMap.current.get(chatId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error("❌ WS no abierto para chat:", chatId);
      return;
    }
    ws.send(JSON.stringify({ contenido }));
  }, []);

  const isChatConnected = useCallback((chatId: number) => {
    const ws = chatWsMap.current.get(chatId);
    return ws?.readyState === WebSocket.OPEN;
  }, []);

  /* ── AUTO-OPEN WS para chats conocidos ─────────────────── */

  const chatList = useAppSelector((state) => state.chat.chatList);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.tokens?.accessToken || chatList.length === 0) return;
    chatList.forEach((chat) => ensureChatWs(chat.id_chat));
  }, [chatList, auth.isAuthenticated, auth.tokens?.accessToken, ensureChatWs]);

  /* ── LOGOUT: cerrar TODOS los WS ──────────────────────── */

  useEffect(() => {
    if (!auth.isAuthenticated) {
      console.log("🚪 WS-Provider: logout – cerrando todas las conexiones");
      // Cerrar notificaciones
      if (notifWsRef.current) {
        notifWsRef.current.close(1000, "Logout");
        notifWsRef.current = null;
      }
      notifConnecting.current = false;
      notifReconnect.current = 0;
      // Cerrar todos los WS de chats
      chatWsMap.current.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, "Logout");
        }
      });
      chatWsMap.current.clear();
      // Limpiar Redux
      dispatch(clearChats());
    }
  }, [auth.isAuthenticated, dispatch]);

  /* ── RENDER ────────────────────────────────────────────── */

  const value: WebSocketContextValue = { ensureChatWs, sendMessage, isChatConnected };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
