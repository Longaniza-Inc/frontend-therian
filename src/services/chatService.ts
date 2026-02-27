import api from "./api";

export interface Mensaje {
  id_mensaje?: number | string;  // ID real (int) o temporal (UUID)
  type?: string;                 // "new_message" cuando viene por WS
  chat_id?: number;
  id_emisor: number | string;
  contenido: string;
  fecha: string;
  esLeido?: boolean;
}

export interface ChatPreview {
  id_chat: number;
  otro_usuario_id: number | string;
  otro_usuario_nombre: string;
  fecha_ultimo_mensaje: string | null;
  ultimo_mensaje?: string;
  unread_count?: number;
}

const CHAT_PREFIX = "/chat";

export const chatService = {
  /**
   * Obtener historial de mensajes de un chat (REST - solo carga inicial)
   */
  async obtenerHistorial(chatId: number): Promise<Mensaje[]> {
    try {
      console.log("📡 chatService.obtenerHistorial - GET", { chatId });
      const response = await api.get<any>(`${CHAT_PREFIX}/${chatId}/mensajes`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      console.log("✅ Historial cargado:", { chatId, cantidad: data.length });
      return data;
    } catch (error: any) {
      console.error("❌ Error al obtener historial:", error.message);
      return [];
    }
  },

  /**
   * Obtener lista de chats (REST - solo carga inicial, después eventos WS la actualizan)
   */
  async obtenerChats(): Promise<ChatPreview[]> {
    try {
      console.log("📡 chatService.obtenerChats - GET /chat/");
      const response = await api.get<any>(`${CHAT_PREFIX}/`);

      let data = response.data;
      if (!Array.isArray(data)) {
        for (const key in data) {
          if (Array.isArray(data[key])) {
            data = data[key];
            break;
          }
        }
      }
      if (!Array.isArray(data)) return [];

      // Ordenar de más reciente a más viejo
      data.sort((a: any, b: any) => {
        const dateA = new Date(a.fecha_ultimo_mensaje || 0).getTime();
        const dateB = new Date(b.fecha_ultimo_mensaje || 0).getTime();
        return dateB - dateA;
      });

      console.log("✅ Chats cargados:", { cantidad: data.length });
      return data;
    } catch (error) {
      console.error("❌ Error en chatService.obtenerChats:", error);
      return [];
    }
  },

  /**
   * Marcar mensajes como leídos (REST)
   */
  async marcarComoLeido(chatId: number): Promise<{ mensajes_actualizados: number }> {
    try {
      const response = await api.put(`${CHAT_PREFIX}/${chatId}/leer`, {});
      return response.data || { mensajes_actualizados: 0 };
    } catch (error) {
      console.error("Error al marcar como leído:", error);
      return { mensajes_actualizados: 0 };
    }
  },

  /**
   * Crear WebSocket para un chat específico
   * Se abre al entrar al chat y se cierra al salir
   */
  conectarWebSocketChat(chatId: number, token: string): WebSocket {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = window.location.host;
    const wsUrl = `${protocol}//${wsHost}/chat/ws/${chatId}?token=${encodeURIComponent(token)}`;
    console.log("🔌 chatService.conectarWebSocketChat:", { chatId, url: wsUrl.split("?")[0] });
    return new WebSocket(wsUrl);
  },

  /**
   * Crear WebSocket global de notificaciones
   * Se abre al loguearse y se mantiene siempre abierto
   */
  conectarWebSocketNotificaciones(token: string): WebSocket {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = window.location.host;
    const wsUrl = `${protocol}//${wsHost}/chat/notifications?token=${encodeURIComponent(token)}`;
    console.log("🔔 chatService.conectarWebSocketNotificaciones:", { url: wsUrl.split("?")[0] });
    return new WebSocket(wsUrl);
  },

  /**
   * Enviar mensaje a través de WebSocket (solo { contenido: ... })
   */
  enviarMensaje(ws: WebSocket, contenido: string): void {
    if (ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket no está conectado");
    }
    const payload = JSON.stringify({ contenido });
    ws.send(payload);
    console.log("📤 Mensaje enviado por WS:", { contenido: contenido.substring(0, 50) });
  },
};
