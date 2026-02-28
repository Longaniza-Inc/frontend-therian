import api from "./api";
import type { UserProfile, FeedCard, PaginatedResponse, ProfileData, ProfileUpdateData } from "@/types";

const USER_PREFIX = "/usuario";

export const userService = {
  /** Get current user profile */
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>(`${USER_PREFIX}/perfil`);
    return response.data;
  },

  /** GET /usuario/perfil/obtener?id=X — Obtener perfil completo */
  async obtenerPerfil(id: number): Promise<ProfileData> {
    try {
      console.log("📋 obtenerPerfil iniciando:", { id, timestamp: new Date().toISOString() });

      const response = await api.get<any>(`${USER_PREFIX}/perfil/obtener`, {
        params: { id },
      });

      const data = response.data;
      console.log("📦 Respuesta bruta del backend:", {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: Array.isArray(data) ? (data[0] ? Object.keys(data[0]) : []) : Object.keys(data),
      });

      // Manejar diferentes formatos de respuesta
      let perfil: any = Array.isArray(data) ? (data.length > 0 ? data[0] : {}) : data;

      if (!perfil || Object.keys(perfil).length === 0) {
        console.warn("⚠️ Respuesta vacía del backend");
        return {} as ProfileData;
      }

      console.log("🖼️ Cargando imágenes. Estructura recibida:", {
        imagenes_count: Array.isArray(perfil.imagenes) ? perfil.imagenes.length : 0,
        id_imagenes_count: Array.isArray(perfil.id_imagenes) ? perfil.id_imagenes.length : 0,
        imagen_principal_id: perfil.imagen_principal_id,
        imagenes: perfil.imagenes,
        id_imagenes: perfil.id_imagenes,
      });

      // Procesar imágenes: combinar URLs con IDs
      const rawImagenes = perfil.imagenes ?? [];
      const rawIds = perfil.id_imagenes ?? [];
      const imagenesList = rawImagenes
        .filter((url: any): url is string => typeof url === "string" && url.length > 0)
        .map((url: string, idx: number) => {
          const id = rawIds[idx];
          const isPrincipal = id === perfil.imagen_principal_id;
          console.log(`  • [${idx}] URL: ${url.substring(0, 40)}... | ID: ${id} | Principal: ${isPrincipal}`);
          return { id, url, isPrincipal };
        });

      // Guardar datos procesados
      perfil.imagenes = imagenesList.map((img) => img.url);
      perfil.id_imagenes = imagenesList.map((img) => img.id);
      perfil.imagen_principal_id = perfil.imagen_principal_id || (imagenesList[0]?.id ?? null);

      console.log("📥 obtenerPerfil - Respuesta final:", {
        username: perfil.username,
        bio: perfil.bio,
        imagenes_count: perfil.imagenes.length,
        imagen_principal_id: perfil.imagen_principal_id,
      });

      return perfil as ProfileData;
    } catch (error: any) {
      console.error("❌ Error en obtenerPerfil:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  /** POST /usuario/perfil/cambiar — Editar perfil */
  async cambiarPerfil(data: ProfileUpdateData): Promise<number> {
    console.log("📨 cambiarPerfil recibe:", data);
    console.log("📦 Payload serializado:", JSON.stringify(data, null, 2));
    const response = await api.post<number>(`${USER_PREFIX}/perfil/cambiar`, data);
    console.log("✅ Respuesta cambiarPerfil:", response.data);
    return response.data;
  },

  /** Update user profile */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.put<UserProfile>(`${USER_PREFIX}/perfil`, data);
    return response.data;
  },

  /** Get feed cards */
  async getFeed(page = 1): Promise<PaginatedResponse<FeedCard>> {
    const response = await api.get<PaginatedResponse<FeedCard>>(`${USER_PREFIX}/feed`, { params: { page } });
    return response.data;
  },

  /** Swipe action */
  async swipe(targetUserId: string, action: string): Promise<void> {
    await api.post(`${USER_PREFIX}/swipe`, { targetUserId, action });
  },

  /** Report user */
  async report(targetUserId: string, reason: string): Promise<void> {
    await api.post(`${USER_PREFIX}/reportar`, { targetUserId, reason });
  },
};
