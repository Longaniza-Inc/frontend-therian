import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { store } from "@/store";
import { setTokens, logout } from "@/store/slices/authSlice";

// API Base URL — configurable mediante variable de entorno VITE_BACKEND_URL
// Ver archivo .env para cambiar la URL según el entorno
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
  withCredentials: true,
});

/* ═══════════════════════════════════════
   TOKEN REFRESH — cola de reintentos
   ═══════════════════════════════════════ */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.tokens?.accessToken;
    
    console.log("🔵 Request interceptor:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: !!token,
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["ngrok-skip-browser-warning"] = "69420";
    
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 with token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Si es 401 y NO es la request de refresh y NO es un reintento
    if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/refresh")) {
      const state = store.getState();
      const refreshToken = state.auth.tokens?.refreshToken;

      if (!refreshToken) {
        console.warn("⚠️ 401 sin refresh token — haciendo logout");
        store.dispatch(logout());
        return Promise.reject(error);
      }

      // Si ya hay otro refresh en curso, encolar esta request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              originalRequest._retry = true;
              resolve(api(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        console.log("🔄 Intentando refresh token...");
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const data = response.data;
        const newAccessToken = data.access_token || data.accessToken;
        const newRefreshToken = data.refresh_token || data.refreshToken || refreshToken;

        console.log("✅ Token refrescado exitosamente");

        store.dispatch(setTokens({
          accessToken: newAccessToken,
          tokenType: "bearer",
          refreshToken: newRefreshToken,
          userId: state.auth.userId ?? undefined,
        }));

        // Reintentar la request original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Refresh token falló — haciendo logout");
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!error.response) {
      console.error("❌ Error de red/conexión:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
