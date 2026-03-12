import { initializeApp } from 'firebase/app';
import { getRemoteConfig, fetchAndActivate, getValue, RemoteConfig } from 'firebase/remote-config';

// Configuración de Firebase - Credenciales extraídas de google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyC95Iyrp8jAZBr2UrpVDRnhEzBQKBrAaOk",
  authDomain: "thalk-10f27.firebaseapp.com",
  projectId: "thalk-10f27",
  storageBucket: "thalk-10f27.firebasestorage.app",
  messagingSenderId: "547980939081",
  appId: "1:547980939081:android:59f1a43cb79c3421fe1498",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Remote Config
const remoteConfig: RemoteConfig = getRemoteConfig(app);

// Configuración de Remote Config
remoteConfig.settings = {
  minimumFetchIntervalMillis: 3600000, // 1 hora - en producción
  fetchTimeoutMillis: 60000, // 60 segundos timeout
};

// Valores por defecto (si no se puede conectar a Firebase)
remoteConfig.defaultConfig = {
  version_minima: "1.3", // Versión mínima requerida (string)
};

/**
 * Inicializa y obtiene la configuración remota de Firebase
 * @returns Promise<boolean> - true si se actualizó correctamente
 */
export const initRemoteConfig = async (): Promise<boolean> => {
  try {
    console.log("🔥 Inicializando Firebase Remote Config...");
    const activated = await fetchAndActivate(remoteConfig);
    console.log(`✅ Remote Config ${activated ? "actualizado" : "cargado desde caché"}`);
    return true;
  } catch (error) {
    console.error("❌ Error inicializando Remote Config:", error);
    return false;
  }
};

/**
 * Obtiene la versión mínima requerida desde Remote Config
 * @returns string - Versión mínima (ej: "1.3")
 */
export const getVersionMinima = (): string => {
  try {
    const value = getValue(remoteConfig, 'version_minima');
    const versionMinima = value.asString();
    console.log("📱 Versión mínima requerida:", versionMinima);
    return versionMinima;
  } catch (error) {
    console.error("❌ Error obteniendo version_minima:", error);
    return "1.3"; // Valor por defecto
  }
};

/**
 * Compara dos versiones en formato "X.Y"
 * @returns boolean - true si versionActual < versionMinima
 */
export const necesitaActualizacion = (versionActual: string, versionMinima: string): boolean => {
  try {
    const [mayorActual, menorActual] = versionActual.split('.').map(Number);
    const [mayorMinima, menorMinima] = versionMinima.split('.').map(Number);

    if (mayorActual < mayorMinima) return true;
    if (mayorActual > mayorMinima) return false;
    return menorActual < menorMinima;
  } catch (error) {
    console.error("❌ Error comparando versiones:", error);
    return false;
  }
};

/**
 * Verifica si la app necesita actualización
 * @param versionActual - Versión actual de la app (ej: "1.3")
 * @returns Promise<boolean> - true si necesita actualización
 */
export const verificarActualizacion = async (versionActual: string): Promise<boolean> => {
  try {
    // Inicializar Remote Config
    await initRemoteConfig();
    
    // Obtener versión mínima
    const versionMinima = getVersionMinima();
    
    // Comparar versiones
    const necesitaUpdate = necesitaActualizacion(versionActual, versionMinima);
    
    console.log(`📊 Versión actual: ${versionActual} | Mínima: ${versionMinima} | Necesita actualización: ${necesitaUpdate}`);
    
    return necesitaUpdate;
  } catch (error) {
    console.error("❌ Error verificando actualización:", error);
    return false;
  }
};

export default {
  initRemoteConfig,
  getVersionMinima,
  necesitaActualizacion,
  verificarActualizacion,
};
