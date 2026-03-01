import api from "./api";
import { store } from "@/store";
import type { LikeM, LikeResponse } from "@/types";

interface FeedFilters {
  id_usuario: number;
  provincia?: number | null;
  tipo_persona?: number | null;
  genero?: number | null;
  edad_min?: number | null;
  edad_max?: number | null;
}

interface FeedUser {
  [key: string]: any;
}

interface FeedResponse {
  users: FeedUser[];
}

class FeedService {
  /**
   * Obtener usuarios recomendados del feed con filtros dinámicos
   */
  static async getRecommendedUsers(filters: FeedFilters): Promise<FeedResponse> {
    try {
      console.log("📡 FeedService.getRecommendedUsers - Iniciando...");
      console.log("📨 REQUEST - Parámetros enviados al backend:", {
        id_usuario: filters.id_usuario,
        provincia: filters.provincia,
        tipo_persona: filters.tipo_persona,
        genero: filters.genero,
        edad_min: filters.edad_min,
        edad_max: filters.edad_max,
      });

      // Construir parámetros query (solo incluir valores no nulos)
      const params: any = {};
      if (filters.provincia !== null && filters.provincia !== undefined) params.provincia = filters.provincia;
      if (filters.tipo_persona !== null && filters.tipo_persona !== undefined) params.tipo_persona = filters.tipo_persona;
      if (filters.genero !== null && filters.genero !== undefined) params.genero = filters.genero;
      if (filters.edad_min !== null && filters.edad_min !== undefined) params.edad_min = filters.edad_min;
      if (filters.edad_max !== null && filters.edad_max !== undefined) params.edad_max = filters.edad_max;

      console.log("📤 GET /feed/recommended_users/" + filters.id_usuario + " con query params:", params);

      const response = await api.get<FeedResponse>(
        `/feed/recommended_users/${filters.id_usuario}`,
        { params }
      );

      console.log("📥 RESPONSE recibido del backend:", response.data);
      console.log("✅ Cantidad de usuarios en response:", response.data.users?.length || 0);
      if (response.data.users && response.data.users.length > 0) {
        console.log("✅ Primer usuario:", JSON.stringify(response.data.users[0], null, 2));
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Error en getRecommendedUsers:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        params: error.config?.params,
      });
      throw error;
    }
  }

  /**
   * Obtener feed sin filtros (todos los usuarios)
   */
  static async getFeed(id_usuario: number): Promise<FeedResponse> {
    return this.getRecommendedUsers({ id_usuario });
  }

  /**
   * Obtener feed con filtros específicos
   */
  static async getFeedFiltered(
    id_usuario: number,
    provincia?: number,
    tipo_persona?: number,
    genero?: number,
    edad_min?: number,
    edad_max?: number
  ): Promise<FeedResponse> {
    return this.getRecommendedUsers({
      id_usuario,
      provincia,
      tipo_persona,
      genero,
      edad_min,
      edad_max,
    });
  }

  /**
   * Dar like a un usuario
   */
  static async likear(liker_id: number, liked_id: number, es_like: boolean = true): Promise<LikeResponse> {
    try {
      console.log("👍 FeedService.likear - Iniciando...");
      console.log("📨 REQUEST - Enviando like:", {
        liker_id,
        liked_id,
        es_like,
      });

      const like: LikeM = {
        liker_id,
        liked_id,
        es_like,
        created_at: new Date().toISOString(), // Enviar fecha actual en ISO format
      };

      const response = await api.post<LikeResponse>("/likes/likear", like);

      console.log("📥 RESPONSE del like:", response.data);
      console.log("✅ Like result:", {
        hubo_match: response.data.hubo_match,
        id_match: response.data.id_match,
        id_chat: response.data.id_chat,
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Error en likear:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Obtener opciones de filtros disponibles
   */
  static async getFilterOptions(): Promise<{
    provincias: Array<{id_provincia: number; nombre_provincia: string}>;
    tipos_persona: Array<{id_tipo_persona: number; nombre_tipo_persona: string}>;
    generos: Array<{id_genero: number; nombre_genero: string}>;
  }> {
    try {
      console.log("🔍 FeedService.getFilterOptions - Iniciando...");
      const response = await api.get("/feed/filtros");
      console.log("✅ Filter options cargadas:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error al cargar filter options:", error);
      // Retornar opciones por defecto si falla
      return {
        provincias: [
          { id_provincia: 1, nombre_provincia: "Buenos Aires" },
          { id_provincia: 2, nombre_provincia: "Córdoba" },
          { id_provincia: 3, nombre_provincia: "Rosario" },
          { id_provincia: 4, nombre_provincia: "Mendoza" },
          { id_provincia: 5, nombre_provincia: "La Plata" }
        ],
        tipos_persona: [
          { id_tipo_persona: 1, nombre_tipo_persona: "Therianthrope" },
          { id_tipo_persona: 2, nombre_tipo_persona: "Furry" },
          { id_tipo_persona: 3, nombre_tipo_persona: "Otherkin" },
          { id_tipo_persona: 4, nombre_tipo_persona: "Polimorfo" }
        ],
        generos: [
          { id_genero: 1, nombre_genero: "Masculino" },
          { id_genero: 2, nombre_genero: "Femenino" },
          { id_genero: 3, nombre_genero: "No binario" },
          { id_genero: 4, nombre_genero: "Prefiero no especificar" }
        ],
      };
    }
  }
}

export default FeedService;
