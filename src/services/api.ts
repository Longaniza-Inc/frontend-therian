import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { store } from "@/store";

// En desarrollo, usar rutas relativas (proxy de vite)
// En producción, usar la URL del backend
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000")
  : "";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log("🔵 Request interceptor:", config.url);
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
    console.log("✅ Response interceptor - OK:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Response interceptor - Error:", {
      message: error.message,
      status: error.response?.status,
      config: error.config?.url,
      data: error.response?.data
    });
    if (error.response?.status === 401) {
      // Token expired or invalid — dispatch logout
      store.dispatch({ type: "auth/logout" });
    }
    return Promise.reject(error);
  },
);

export default api;
