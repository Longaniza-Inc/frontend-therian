import api from "./api";

const IMAGEN_PREFIX = "/imagen";

export const imagenService = {
  /** POST /imagen/upload — Subir imagen con JWT */
  async uploadImage(file: File): Promise<{ id_imagen: number; url: string; es_principal: boolean }> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      console.log("📸 uploadImage INICIANDO:", {
        filename: file.name,
        size_bytes: file.size,
        size_kb: (file.size / 1024).toFixed(2),
        type: file.type,
        timestamp: new Date().toISOString(),
      });

      console.log("📦 FormData a enviar:", {
        has_image_field: formData.has("image"),
        entries: Array.from(formData.entries()).map(([key]) => key),
      });

      const response = await api.post<{ id_imagen: number; url: string; es_principal: boolean }>(
        `${IMAGEN_PREFIX}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("✅ UPLOAD EXITOSO:", {
        id_imagen: response.data.id_imagen,
        url: response.data.url,
        es_principal: response.data.es_principal,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ ERROR EN UPLOAD:", {
        mensaje: error.message,
        status: error.response?.status,
        detail: error.response?.data,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  /** DELETE /imagen/{id_imagen} — Eliminar imagen con JWT */
  async deleteImage(id_imagen: number): Promise<{ message: string }> {
    try {
      console.log("🗑️ DELETE IMAGE INICIANDO:", {
        id_imagen: id_imagen,
        endpoint: `${IMAGEN_PREFIX}/${id_imagen}`,
        timestamp: new Date().toISOString(),
      });

      const response = await api.delete<{ message: string }>(
        `${IMAGEN_PREFIX}/${id_imagen}`
      );

      console.log("✅ DELETE EXITOSO:", {
        id_imagen: id_imagen,
        respuesta: response.data,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ ERROR EN DELETE:", {
        id_imagen: id_imagen,
        mensaje: error.message,
        status: error.response?.status,
        detail: error.response?.data,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  /** PUT /imagen/{imagen_id}/principal — Cambiar imagen principal con JWT */
  async setImagenPrincipal(imagen_id: number): Promise<{ message: string }> {
    try {
      console.log("📌 SET PRINCIPAL INICIANDO:", {
        imagen_id: imagen_id,
        endpoint: `${IMAGEN_PREFIX}/${imagen_id}/principal`,
        timestamp: new Date().toISOString(),
      });

      const response = await api.put<{ message: string }>(
        `${IMAGEN_PREFIX}/${imagen_id}/principal`
      );

      console.log("✅ SET PRINCIPAL EXITOSO:", {
        imagen_id: imagen_id,
        respuesta: response.data,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ ERROR EN SET PRINCIPAL:", {
        imagen_id: imagen_id,
        mensaje: error.message,
        status: error.response?.status,
        detail: error.response?.data,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },
};
