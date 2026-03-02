import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ChatPreview, Mensaje } from "@/services/chatService";

/* ═══════════════════════════════════════
   INTERFACES
   ═══════════════════════════════════════ */

interface ChatUpdate {
  chat_id: number;
  ultimo_mensaje: string;
  id_emisor: number;
  timestamp: string;
  unread_count: number;
  tipo_mensaje?: string;
  imagen_url?: string | null;
}

interface ChatState {
  /** Lista de previews del sidebar */
  chatList: ChatPreview[];
  /** Mensajes por chat: chatId → Mensaje[] */
  messagesByChat: Record<number, Mensaje[]>;
  /** Chats cuyo historial ya fue pedido (evita requests duplicados) */
  historyRequested: Record<number, boolean>;
  /** IDs de chats cuyo WS ya fue abierto (persiste toda la sesión) */
  activeChatIds: number[];
  /** Contadores de no leídos */
  unreadCounts: Record<number, number>;
  /** Flag para indicar que la lista debe recargarse (nuevo chat, match, etc.) */
  shouldRefreshList: boolean;
  /** Chats cargados al menos una vez (para pantalla de carga inicial) */
  chatsLoaded: boolean;
}

const initialState: ChatState = {
  chatList: [],
  messagesByChat: {},
  historyRequested: {},
  activeChatIds: [],
  unreadCounts: {},
  shouldRefreshList: false,
  chatsLoaded: false,
};

/* ═══════════════════════════════════════
   SLICE
   ═══════════════════════════════════════ */

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    /** Carga inicial GET /chat/ */
    setChatList(state, action: PayloadAction<ChatPreview[]>) {
      state.chatList = action.payload.sort((a, b) => {
        const dA = new Date(a.fecha_ultimo_mensaje || 0).getTime();
        const dB = new Date(b.fecha_ultimo_mensaje || 0).getTime();
        return dB - dA;
      });
      // Inicializar unread counts desde backend
      action.payload.forEach((c) => {
        if (state.unreadCounts[c.id_chat] === undefined) {
          state.unreadCounts[c.id_chat] = c.unread_count ?? 0;
        }
      });
    },

    /** Marcar que el historial de un chat ya fue solicitado (antes de la request) */
    markHistoryRequested(state, action: PayloadAction<number>) {
      state.historyRequested[action.payload] = true;
    },

    /** Setear historial completo de un chat (REST GET /chat/{id}/mensajes) */
    setMessagesForChat(state, action: PayloadAction<{ chatId: number; mensajes: Mensaje[] }>) {
      state.messagesByChat[action.payload.chatId] = action.payload.mensajes;
      state.historyRequested[action.payload.chatId] = true;
    },

    /** Agregar UN mensaje nuevo (desde WS new_message) */
    addMessage(state, action: PayloadAction<{ chatId: number; mensaje: Mensaje }>) {
      const { chatId, mensaje } = action.payload;
      if (!state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = [];
      }
      // Evitar duplicados por id_mensaje
      if (mensaje.id_mensaje) {
        const exists = state.messagesByChat[chatId].some(
          (m) => m.id_mensaje && m.id_mensaje === mensaje.id_mensaje
        );
        if (exists) return;
      }
      state.messagesByChat[chatId].push(mensaje);
    },

    /** Evento chat_update del WS global: actualiza preview + mueve al top */
    updateChatPreview(state, action: PayloadAction<ChatUpdate>) {
      const { chat_id, ultimo_mensaje, timestamp, unread_count, tipo_mensaje, imagen_url } = action.payload;
      const idx = state.chatList.findIndex((c) => c.id_chat === chat_id);
      if (idx !== -1) {
        state.chatList[idx].ultimo_mensaje = ultimo_mensaje;
        state.chatList[idx].contenido_mensaje = ultimo_mensaje;
        state.chatList[idx].fecha_ultimo_mensaje = timestamp;
        state.unreadCounts[chat_id] = unread_count;
        // Actualizar tipo_mensaje e imagen_url si se proporcionan
        if (tipo_mensaje) {
          state.chatList[idx].tipo_mensaje = tipo_mensaje;
        }
        if (imagen_url !== undefined) {
          state.chatList[idx].imagen_url = imagen_url;
        }
        // Mover al top
        const [moved] = state.chatList.splice(idx, 1);
        state.chatList.unshift(moved);
      }
    },

    /** Parchar tipo_mensaje / contenido_mensaje sin reordenar la lista */
    patchChatPreview(state, action: PayloadAction<{ chatId: number; tipo_mensaje?: string; contenido_mensaje?: string | null }>) {
      const idx = state.chatList.findIndex((c) => c.id_chat === action.payload.chatId);
      if (idx !== -1) {
        if (action.payload.tipo_mensaje) {
          state.chatList[idx].tipo_mensaje = action.payload.tipo_mensaje;
        }
        if (action.payload.contenido_mensaje !== undefined) {
          state.chatList[idx].contenido_mensaje = action.payload.contenido_mensaje;
        }
      }
    },

    /** Marcar chat como leído */
    markChatRead(state, action: PayloadAction<number>) {
      state.unreadCounts[action.payload] = 0;
    },

    /** Incrementar unread (cuando llega mensaje y NO estoy viendo ese chat) */
    incrementUnread(state, action: PayloadAction<number>) {
      const chatId = action.payload;
      state.unreadCounts[chatId] = (state.unreadCounts[chatId] || 0) + 1;
    },

    /** Registrar un chatId como activo (WS abierto) */
    addActiveChatId(state, action: PayloadAction<number>) {
      if (!state.activeChatIds.includes(action.payload)) {
        state.activeChatIds.push(action.payload);
      }
    },

    /** Limpiar todo (logout) */
    clearChats(state) {
      state.chatList = [];
      state.messagesByChat = {};
      state.historyRequested = {};
      state.activeChatIds = [];
      state.unreadCounts = {};
      state.shouldRefreshList = false;
      state.chatsLoaded = false;
    },

    /** Marcar chats como cargados al menos una vez */
    setChatsLoaded(state) {
      state.chatsLoaded = true;
    },

    /** Marcar que la lista debe recargarse (nuevo chat, match, etc.) */
    invalidateChatList(state) {
      state.shouldRefreshList = true;
    },

    /** Resetear el flag de refresh después de recargar */
    resetRefreshFlag(state) {
      state.shouldRefreshList = false;
    },

    /** Marcar un mensaje como eliminado (soft delete desde WS message_deleted) */
    deleteMessage(state, action: PayloadAction<{ chatId: number; mensajeId: number | string }>) {
      const { chatId, mensajeId } = action.payload;
      const msgs = state.messagesByChat[chatId];
      if (!msgs) return;
      const idx = msgs.findIndex(
        (m) => m.id_mensaje !== undefined && String(m.id_mensaje) === String(mensajeId)
      );
      if (idx !== -1) {
        msgs[idx] = {
          ...msgs[idx],
          eliminado: true,
          contenido: null,
          imagenes: [],
          tiempo_restante_segundos: 0,
        };
      }
    },
  },
});

export const {
  setChatList,
  markHistoryRequested,
  setMessagesForChat,
  addMessage,
  updateChatPreview,
  patchChatPreview,
  markChatRead,
  incrementUnread,
  addActiveChatId,
  clearChats,
  setChatsLoaded,
  invalidateChatList,
  resetRefreshFlag,
  deleteMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
