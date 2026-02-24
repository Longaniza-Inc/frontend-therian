import api from "./api";
import type { GoogleCallbackResponse } from "@/types";

const AUTH_PREFIX = "/auth";

export const authService = {
  /** Get Google OAuth login URL */
  async googleLogin(): Promise<string> {
    console.log("📡 authService.googleLogin - Iniciando...");
    try {
      const response = await api.get(`${AUTH_PREFIX}/google/login`);
      console.log("📡 Response completo:", response);
      console.log("📡 response.data:", response.data);
      const url = response.data?.url;
      console.log("📡 URL extraída:", url);
      if (!url) {
        throw new Error("No se recibió URL en la respuesta");
      }
      return url;
    } catch (error) {
      console.error("📡 Error en googleLogin:", error);
      throw error;
    }
  },

  /** Handle Google OAuth callback */
  async googleCallback(params: Record<string, string>): Promise<GoogleCallbackResponse> {
    const response = await api.get<GoogleCallbackResponse>(`${AUTH_PREFIX}/google/callback`, { params });
    return response.data;
  },

  /** Register a new user with form data (multipart) */
  async register(userData: string, images: File[]): Promise<GoogleCallbackResponse> {
    const formData = new FormData();
    formData.append("usuario", userData);
    images.forEach((img) => formData.append("imagenes", img));

    const response = await api.post<GoogleCallbackResponse>(`${AUTH_PREFIX}/registro`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /** Get all etiquetas/tags */
  async getEtiquetas(): Promise<any> {
    try {
      console.log("📡 Intentando cargar etiquetas de: /etiquetas/listar");
      const response = await api.get("/etiquetas/listar", {
        responseType: "json",
        timeout: 5000,
      });
      console.log("✅ Respuesta de etiquetas completa:", response);
      console.log("✅ Data:", response.data);
      console.log("✅ Status:", response.status);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error en getEtiquetas:", {
        mensaje: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        url: error.config?.url,
        fullError: error
      });
      throw error;
    }
  },

  /** Get all géneros */
  async getGeneros(): Promise<any> {
    try {
      console.log("📡 Intentando cargar géneros de: /usuario/genero");
      const response = await api.get("/usuario/genero", {
        responseType: "json",
        timeout: 5000,
      });
      console.log("✅ Géneros cargados:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error en getGeneros:", {
        mensaje: error.message,
        status: error.response?.status,
        url: error.config?.url,
      });
      throw error;
    }
  },

  /** Get all provincias */
  async getProvincias(): Promise<any> {
    try {
      console.log("📡 Intentando cargar provincias de: /usuario/provincias");
      const response = await api.get("/usuario/provincias", {
        responseType: "json",
        timeout: 5000,
      });
      console.log("✅ Provincias cargadas:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error en getProvincias:", {
        mensaje: error.message,
        status: error.response?.status,
        url: error.config?.url,
      });
      throw error;
    }
  },

  /** Get all tipo personas */
  async getTipoPersonas(): Promise<any> {
    try {
      console.log("📡 Intentando cargar tipos de personas de: /usuario/tipo_personas");
      const response = await api.get("/usuario/tipo_personas", {
        responseType: "json",
        timeout: 5000,
      });
      console.log("✅ Tipos de personas cargados:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error en getTipoPersonas:", {
        mensaje: error.message,
        status: error.response?.status,
        url: error.config?.url,
      });
      throw error;
    }
  },
};
