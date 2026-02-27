import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { store } from "@/store";

// API Base URL — apuntar directamente al backend
// En desarrollo: backend corre en puerto 8000
// En producción: usar variable de entorno o mismo host que frontend
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000")
  : "http://127.0.0.1:8000";  // En dev, apuntar directamente al backend en puerto 8000

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,  // Incluir cookies/credentials
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log("🔵 Request interceptor:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      data: config.data ? "present" : "none"
    });
    const state = store.getState();
    const token = state.auth.tokens?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ Response interceptor - OK:", {
      status: response.status,
      url: response.config.url,
      dataSize: JSON.stringify(response.data).length,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    console.error("❌ Response interceptor - Error:", {
      message: error.message,
      status: status,
      url: url,
      responseData: error.response?.data ? JSON.stringify(error.response.data).slice(0, 300) : "no data",
      hasResponse: !!error.response,
      isNetworkError: !error.response && error.message
    });
    
    // ═══════════════════════════════════════════════════════════════
    // SOLO hacer logout en 401 autenticado (token expirado/inválido)
    // ═══════════════════════════════════════════════════════════════
    if (status === 401) {
      console.warn("⚠️ 401 Unauthorized — Token inválido/expirado. Despachando logout...");
      store.dispatch({ type: "auth/logout" });
    } else if (status && status >= 500) {
      console.error("❌ Error del servidor (5xx) — NO hacer logout. Solo rechazar la promesa.");
    } else if (status === 404) {
      console.warn("⚠️ Recurso no encontrado (404) — NO hacer logout.");
    } else if (!error.response) {
      console.error("❌ Error de red/conexión — NO hacer logout.");
    } else {
      console.warn(`⚠️ Otro error HTTP (${status}) — NO hacer logout automático.`);
    }
    
    return Promise.reject(error);
  },
);

export default api;
