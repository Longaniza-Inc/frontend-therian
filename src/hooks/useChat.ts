import { useEffect, useRef, useCallback, useMemo } from "react";
import { chatService } from "@/services/chatService";
import type { MensajeImagen } from "@/services/chatService";
import { useAppSelector, useAppDispatch } from "./useAppDispatch";
import { useWebSocket } from "@/providers/WebSocketProvider";
import type { WsOutgoingMessage } from "@/providers/WebSocketProvider";
import {
  setMessagesForChat,
  markHistoryRequested,
  markChatRead,
  deleteMessage,
  updateChatPreview,
} from "@/store/slices/chatSlice";

/**
 * Hook para un chat específico.
 *
 * - Lee mensajes desde Redux (NO estado local).
 * - Pide al WebSocketProvider que abra el WS (idempotente, persiste toda la sesión).
 * - Carga historial REST solo si no está ya en Redux.
 * - Marca como leído al entrar.
 * - Envía mensajes a través del Provider.
 *
 * NO abre ni cierra WebSockets. Eso lo hace el Provider.
 */
export const useChat = (chatId: number | null) => {
  const auth = useAppSelector((state) => state.auth);
  const messagesByChat = useAppSelector((state) => state.chat.messagesByChat);
  const mensajes = useMemo(
    () => (chatId ? messagesByChat[chatId] ?? [] : []),
    [chatId, messagesByChat]
  );
  const hasMessages = chatId ? messagesByChat[chatId] !== undefined : false;
  const historyRequested = useAppSelector((state) =>
    chatId ? !!state.chat.historyRequested[chatId] : false
  );
  const isLoadingHistory = historyRequested && !hasMessages;
  const dispatch = useAppDispatch();
  const { ensureChatWs, sendMessage, sendWsMessage, isChatConnected } = useWebSocket();

  const markedReadRef = useRef<number | null>(null);

  // ── 1. Cargar historial REST solo si NO está en Redux y NO fue pedido ya ──
  useEffect(() => {
    if (!chatId || !auth.isAuthenticated || hasMessages || historyRequested) return;

    dispatch(markHistoryRequested(chatId));

    const cargar = async () => {
      try {
        console.log("📥 useChat - Cargando historial REST:", chatId);
        const data = await chatService.obtenerHistorial(chatId);
        dispatch(setMessagesForChat({ chatId, mensajes: Array.isArray(data) ? data : [] }));
      } catch (err) {
        console.error("❌ Error cargando historial:", err);
        dispatch(setMessagesForChat({ chatId, mensajes: [] }));
      }
    };

    cargar();
  }, [chatId, auth.isAuthenticated, hasMessages, historyRequested, dispatch]);

  // ── 2. Pedir al Provider que abra WS (idempotente) ─────────
  useEffect(() => {
    if (!chatId || !auth.isAuthenticated) return;
    ensureChatWs(chatId);
  }, [chatId, auth.isAuthenticated, ensureChatWs]);

  // ── 3. Marcar como leído (una vez por chatId) ──────────────
  useEffect(() => {
    if (!chatId || !auth.isAuthenticated || markedReadRef.current === chatId) return;
    markedReadRef.current = chatId;

    // Silenciar errores — no es crítico
    chatService.marcarComoLeido(chatId).catch((err) => {
      console.warn("⚠️ No se pudo marcar como leído", chatId, err?.message);
    });
    dispatch(markChatRead(chatId));
  }, [chatId, auth.isAuthenticated, dispatch]);

  // ── Enviar mensaje ─────────────────────────────────────────
  const enviarMensaje = useCallback(
    (contenido: string) => {
      if (!chatId) return;
      // Actualización optimista del preview
      dispatch(updateChatPreview({
        chat_id: chatId,
        ultimo_mensaje: contenido,
        id_emisor: auth.userId || 0,
        timestamp: new Date().toISOString(),
        unread_count: 0,
        tipo_mensaje: "mensaje",
      }));
      sendMessage(chatId, contenido);
    },
    [chatId, sendMessage, auth.userId, dispatch]
  );

  // ── Enviar mensaje con reply ─────────────────────────────
  const enviarMensajeConReply = useCallback(
    (contenido: string, replyToId: number | string) => {
      if (!chatId) return;
      // Actualización optimista del preview
      dispatch(updateChatPreview({
        chat_id: chatId,
        ultimo_mensaje: contenido,
        id_emisor: auth.userId || 0,
        timestamp: new Date().toISOString(),
        unread_count: 0,
        tipo_mensaje: "mensaje",
      }));
      sendWsMessage(chatId, {
        contenido,
        tipo: "mensaje",
        id_mensaje_reply: replyToId,
      });
    },
    [chatId, sendWsMessage, auth.userId, dispatch]
  );

  // ── Enviar imagen ─────────────────────────────────────────
  const enviarImagen = useCallback(
    (imagenes: MensajeImagen[], replyToId?: number | string | null) => {
      if (!chatId) return;
      // Actualización optimista del preview (mostrar que se envió imagen)
      dispatch(updateChatPreview({
        chat_id: chatId,
        ultimo_mensaje: "📸 Foto",
        id_emisor: auth.userId || 0,
        timestamp: new Date().toISOString(),
        unread_count: 0,
        tipo_mensaje: "imagen",
        imagen_url: imagenes[0]?.url || null,
      }));
      const payload: WsOutgoingMessage = {
        tipo: "imagen",
        imagenes,
      };
      if (replyToId) payload.id_mensaje_reply = replyToId;
      sendWsMessage(chatId, payload);
    },
    [chatId, sendWsMessage, auth.userId, dispatch]
  );

  const isConnected = chatId ? isChatConnected(chatId) : false;

  // ── Eliminar mensaje ────────────────────────────────────────
  const eliminarMensaje = useCallback(
    async (mensajeId: number | string) => {
      if (!chatId) return;
      try {
        // Optimista: actualizar Redux antes de la respuesta
        dispatch(deleteMessage({ chatId, mensajeId }));
        // Llamada REST (el backend también hace broadcast WS, pero ya lo marcamos)
        await chatService.eliminarMensaje(mensajeId);
      } catch (err) {
        console.error("❌ Error al eliminar mensaje:", err);
      }
    },
    [chatId, dispatch]
  );

  return {
    mensajes,
    isConnected,
    isLoadingHistory,
    enviarMensaje,
    enviarMensajeConReply,
    enviarImagen,
    eliminarMensaje,
  };
};
