import api from "./api";
import type { GoogleCallbackResponse } from "@/types";

const AUTH_PREFIX = "/auth";

export const authService = {
  /** POST /auth/google — Login directo con id_token de Google (Mobile + SPA) */
  async googleAuth(idToken: string): Promise<GoogleCallbackResponse> {
    console.log("📡 authService.googleAuth - Enviando id_token...");
    try {
      const response = await api.post<GoogleCallbackResponse>(`${AUTH_PREFIX}/google`, {
        id_token: idToken,
      });
      console.log("✅ Google auth response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error en googleAuth:", error);
      throw error;
    }
  },

  /** GET /auth/google/login — Obtener URL de autorización de Google */
  async googleLogin(): Promise<string> {
    console.log("📡 authService.googleLogin - Iniciando...");
    try {
      const response = await api.get(`${AUTH_PREFIX}/google/login`);
      console.log("📡 Response:", response.data);
      const url = response.data?.url;
      if (!url) {
        throw new Error("No se recibió URL en la respuesta");
      }
      return url;
    } catch (error: any) {
      console.error("❌ Error en googleLogin:", error);
      throw error;
    }
  },

  /** GET /auth/google/callback — Manejado por backend, frontend solo espera localStorage */
  async handleCallback(): Promise<void> {
    // El backend inyecta authData en localStorage y redirige aquí
    // No hay que hacer nada extra desde aquí
    console.log("📡 handleCallback - Esperando datos en localStorage...");
  },

  /** POST /auth/registro — Registrar usuario nuevo */
  async register(userData: string, images: File[]): Promise<GoogleCallbackResponse> {
    const formData = new FormData();
    formData.append("usuario", userData);
    images.forEach((img) => formData.append("imagenes", img));

    const response = await api.post<GoogleCallbackResponse>(`${AUTH_PREFIX}/registro`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /** GET /auth/me — Obtener usuario autenticado actual */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await api.get(`${AUTH_PREFIX}/me`);
      console.log("✅ User info:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error al obtener usuario:", error);
      throw error;
    }
  },

  /** POST /auth/refresh — Refrescar access_token */
  async refreshToken(refreshToken: string): Promise<GoogleCallbackResponse> {
    try {
      const response = await api.post<GoogleCallbackResponse>(`${AUTH_PREFIX}/refresh`, {
        refresh_token: refreshToken,
      });
      console.log("✅ Token refrescado");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error al refrescar token:", error);
      throw error;
    }
  },

  /** POST /auth/logout — Cerrar sesión y revocar refresh_token */
  async logout(refreshToken: string): Promise<any> {
    try {
      const response = await api.post(`${AUTH_PREFIX}/logout`, {
        refresh_token: refreshToken,
      });
      console.log("✅ Sesión cerrada");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error al cerrar sesión:", error);
      throw error;
    }
  },

  /** GET /etiquetas/listar — Obtener etiquetas */
  async getEtiquetas(): Promise<any> {
    try {
      console.log("📡 Cargando etiquetas...");
      const response = await api.get("/etiquetas/listar", {
        responseType: "json",
        timeout: 5000,
      });
      console.log("✅ Etiquetas cargadas:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error en getEtiquetas:", error);
      throw error;
    }
  },

  /** GET /usuario/genero — Obtener géneros */
  async getGeneros(): Promise<any> {
    try {
      const response = await api.get("/usuario/genero", {
        responseType: "json",
        timeout: 5000,
      });
      console.log("✅ Géneros cargados:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error en getGeneros:", error);
      throw error;
    }
  },

  /** GET /usuario/provincias — Obtener provincias */
  async getProvincias(): Promise<any> {
    try {
      const response = await api.get("/usuario/provincias", {
        responseType: "json",
        timeout: 5000,
      });
      console.log("✅ Provincias cargadas:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error en getProvincias:", error);
      throw error;
    }
  },

  /** GET /usuario/tipo_personas — Obtener tipos de personas */
  async getTipoPersonas(): Promise<any> {
    try {
      const response = await api.get("/usuario/tipo_personas", {
        responseType: "json",
        timeout: 5000,
      });
      console.log("✅ Tipos de personas cargados:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error en getTipoPersonas:", error);
      throw error;
    }
  },
};
