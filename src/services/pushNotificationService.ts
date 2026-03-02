import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { FCM } from "@capacitor-community/fcm";

/**
 * Servicio de Push Notifications con Firebase Cloud Messaging.
 *
 * Usa @capacitor/push-notifications para permisos y listeners,
 * y @capacitor-community/fcm para obtener el token FCM real.
 *
 * Flujo:
 * 1. requestPermission() → pide permiso al usuario (Android 13+)
 * 2. getToken() → devuelve el token FCM del dispositivo
 * 3. setupListeners() → escucha notificaciones en primer plano y clicks
 */

let currentFcmToken: string | null = null;

/**
 * Solicita permisos de notificación al usuario.
 * En Android < 13 se concede automáticamente.
 * En Android 13+ muestra un diálogo nativo.
 * @returns true si se concedió permiso
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log("📱 Push: No es plataforma nativa, skip");
    return false;
  }

  try {
    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      const result = await PushNotifications.requestPermissions();
      return result.receive === "granted";
    }

    return permStatus.receive === "granted";
  } catch (error) {
    console.error("❌ Error pidiendo permisos push:", error);
    return false;
  }
}

/**
 * Obtiene el token FCM del dispositivo.
 * Primero registra con PushNotifications, luego obtiene el token real de FCM.
 * @returns El token FCM o null si falla
 */
export async function getFCMToken(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    // Registrar el dispositivo para push notifications
    await PushNotifications.register();

    // Pequeño delay para asegurar que Firebase está listo
    await new Promise(resolve => setTimeout(resolve, 500));

    // Obtener el token FCM real (no el token genérico de Capacitor)
    const { token } = await FCM.getToken();
    currentFcmToken = token;
    console.log("✅ FCM Token obtenido:", token.substring(0, 20) + "...");
    return token;
  } catch (error) {
    console.error("❌ Error obteniendo FCM token:", error);
    return null;
  }
}

/**
 * Devuelve el token FCM cacheado sin hacer otra llamada.
 */
export function getCachedFCMToken(): string | null {
  return currentFcmToken;
}

/**
 * Configura los listeners para notificaciones push.
 * Debe llamarse una sola vez al iniciar la app (después del login).
 *
 * @param onNotificationReceived - Callback cuando llega notificación en primer plano
 * @param onNotificationClicked - Callback cuando el usuario hace click en una notificación
 */
export function setupPushListeners(options: {
  onNotificationReceived?: (data: any) => void;
  onNotificationClicked?: (data: any) => void;
}) {
  if (!Capacitor.isNativePlatform()) return;

  // Notificación recibida en primer plano
  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("📬 Notificación recibida (foreground):", notification);
    options.onNotificationReceived?.(notification);
  });

  // Usuario hace click en la notificación
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("👆 Click en notificación:", action);
    options.onNotificationClicked?.(action.notification);
  });

  // Token de registro recibido (push genérico)
  PushNotifications.addListener("registration", (token) => {
    console.log("📱 Push registration token:", token.value.substring(0, 20) + "...");
  });

  // Token FCM refrescado
  FCM.onTokenRefresh(() => {
    console.log("🔄 Token FCM refrescado, actualizando...");
    getFCMToken().then((token) => {
      if (token) {
        console.log("✅ Nuevo token FCM guardado:", token.substring(0, 20) + "...");
        // El backend debería estar escuchando cambios de token y sincronizar automáticamente
        // Si no, se puede enviar una llamada aquí to notify the backend
      }
    }).catch(err => console.error("❌ Error refrescando token FCM:", err));
  });

  // Error en el registro
  PushNotifications.addListener("registrationError", (error) => {
    console.error("❌ Error en push registration:", error);
  });

  // Nota: La renovación del token FCM se obtiene via getFCMToken() cuando es necesario.
  // El listener onTokenRefresh se puede disparar manualmente desde useAuth cuando
  // el backend notifique que hay un nuevo token disponible.
}

/**
 * Elimina todos los listeners de push notifications.
 * Llamar al hacer logout.
 */
export async function removePushListeners() {
  if (!Capacitor.isNativePlatform()) return;
  await PushNotifications.removeAllListeners();
  currentFcmToken = null;
  console.log("🧹 Push listeners removidos");
}
