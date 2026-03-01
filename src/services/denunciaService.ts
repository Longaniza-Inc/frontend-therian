import api from "./api";

export interface MotivoDenuncia {
  id_motivo_denuncia: number;
  nombre_motivo: string;
}

export interface TipoDenuncia {
  id_tipo_denuncia: number;
  nombre_tipo_denuncia: string;
}

export interface DatosDenuncia {
  motivo: MotivoDenuncia[];
  tipo: TipoDenuncia[];
}

interface EvidenciaAdicional {
  contenido_texto?: string;
  contenido_url?: string;
}

export interface DenunciaUsuario {
  id_denunciado: number;
  id_tipo_denuncia: number;
  id_motivo_denuncia: number;
  tipo_contenido: "BIOGRAFIA" | "NOMBRE" | "IMAGEN";
  id_imagen?: number;
  descripcion?: string;
  evidencias?: EvidenciaAdicional[];
}

interface DenunciaMensaje {
  id_mensaje: number;
  id_tipo_denuncia: number;
  id_motivo_denuncia: number;
  descripcion?: string;
}

export interface DenunciaResponse {
  mensaje: string;
  id_denuncia: number;
  tipo_denuncia: string;
  [key: string]: any;
}

class DenunciaService {
  /**
   * Obtener motivos y tipos de denuncia disponibles
   */
  static async obtenerDatos(): Promise<DatosDenuncia> {
    try {
      console.log("📋 DenunciaService.obtenerDatos - Cargando motivos y tipos...");
      const response = await api.get<DatosDenuncia>("/denuncias/datos");
      console.log("✅ Datos de denuncia cargados:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error al obtener datos de denuncia:", error.message);
      // Retornar datos por defecto si hay error
      return {
        motivo: [],
        tipo: [],
      };
    }
  }

  /**
   * Denunciar usuario por biografía, nombre o imagen
   */
  static async denunciarUsuario(denuncia: DenunciaUsuario): Promise<DenunciaResponse> {
    try {
      console.log("🚨 DenunciaService.denunciarUsuario - Iniciando...", denuncia);
      const response = await api.post<DenunciaResponse>("/denuncias/usuario", denuncia);
      console.log("✅ Denuncia de usuario creada:", {
        id_denuncia: response.data.id_denuncia,
        tipo_contenido: denuncia.tipo_contenido,
        id_motivo_denuncia: denuncia.id_motivo_denuncia,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error denunciando usuario:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Denunciar mensaje (texto o imagen adjunta)
   */
  static async denunciarMensaje(denuncia: DenunciaMensaje): Promise<DenunciaResponse> {
    try {
      console.log("🚨 DenunciaService.denunciarMensaje - Iniciando...", denuncia);
      const response = await api.post<DenunciaResponse>("/denuncias/mensaje", denuncia);
      console.log("✅ Denuncia de mensaje creada:", {
        id_denuncia: response.data.id_denuncia,
        id_mensaje: denuncia.id_mensaje,
        id_motivo_denuncia: denuncia.id_motivo_denuncia,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error denunciando mensaje:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Obtener detalles de una denuncia
   */
  static async obtenerDenuncia(id_denuncia: number): Promise<any> {
    try {
      console.log("📖 DenunciaService.obtenerDenuncia - ID:", id_denuncia);
      const response = await api.get(`/denuncias/${id_denuncia}`);
      console.log("✅ Denuncia obtenida:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error obteniendo denuncia:", {
        message: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }
}

export default DenunciaService;
