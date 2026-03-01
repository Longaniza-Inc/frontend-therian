import api from "./api";

export interface MensajeImagen {
  url: string;
  delete_url?: string;
}

export interface MensajeReply {
  id_mensaje: number | string;
  id_emisor: number | string;
  contenido: string | null;
  tipo?: "mensaje" | "imagen";
}

export interface Mensaje {
  id_mensaje?: number | string;  // ID real (int) o temporal (UUID)
  type?: string;                 // "new_message" cuando viene por WS
  chat_id?: number;
  id_emisor: number | string;
  contenido: string | null;
  fecha: string;
  esLeido?: boolean;
  tipo?: "mensaje" | "imagen";   // tipo de mensaje
  id_mensaje_reply?: number | string | null; // ID del mensaje al que responde
  mensaje_reply?: MensajeReply | null;       // datos completos del mensaje original (desde historial REST)
  imagenes?: MensajeImagen[];    // imágenes adjuntas (solo tipo=imagen)
  eliminado?: boolean;           // mensaje eliminado (soft delete)
  tiempo_restante_segundos?: number | null;  // segundos restantes para poder eliminarlo (<=0 = expirado)
}

export interface ChatPreview {
  id_chat: number;
  otro_usuario_id: number | string;
  otro_usuario_nombre: string;
  fecha_ultimo_mensaje: string | null;
  ultimo_mensaje?: string;
  contenido_mensaje?: string | null;  // último mensaje desde backend
  tipo_mensaje?: string | null;        // tipo del último mensaje
  mensajes_sin_leer?: number;          // contador de no leídos desde backend
  unread_count?: number;               // unread desde Redis
  imagen_url?: string | null;  // foto de perfil del otro usuario
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
   * Eliminar mensaje (soft delete) — DELETE /chat/mensaje/{mensajeId}
   */
  async eliminarMensaje(mensajeId: number | string): Promise<{ id_mensaje: number; chat_id: number }> {
    const response = await api.delete(`${CHAT_PREFIX}/mensaje/${mensajeId}`);
    return response.data;
  },

  /**
   * Subir imagen para chat — POST /chat/{chatId}/upload-image
   */
  async subirImagenChat(chatId: number, file: File): Promise<MensajeImagen> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<MensajeImagen>(
      `${CHAT_PREFIX}/${chatId}/upload-image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },
};
