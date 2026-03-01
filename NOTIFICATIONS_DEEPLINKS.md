# Notificaciones con Deep Links

## 📱 Deep Links Soportados

El hook `useDeepLink()` ahora soporta estos patrones de deep links para notificaciones:

### 1. Nuevo Mensaje (Notificación Push)

**Patrón de Deep Link:**
```
pawtalk://notification?type=message&chatId=12345
```

**Qué hace:**
- La app se abre
- Hook navega a `/chat/12345` (abre el chat específico)

**Cuándo usarlo:**
- Firebase notifica: "Juan te envió un mensaje"
- Usuario hace click en la notificación
- La app abre en ese chat específicamente

---

### 2. Nuevo Chat / Match

**Patrón de Deep Link:**
```
pawtalk://new-match
```

O con query params:
```
pawtalk://notification?type=match
```

**Qué hace:**
- La app se abre
- Hook navega a `/` (feed, donde están los nuevos matches)

**Cuándo usarlo:**
- Se crea un nuevo match (dos usuarios se gustan mutuamente)
- Firebase notifica: "¡Tienes un nuevo match! 🐾"
- Usuario hace click
- La app abre el feed para ver el nuevo chat

---

### 3. Abrir Chat Directo

**Patrón de Deep Link:**
```
pawtalk://chat/12345
```

**Qué hace:**
- La app se abre
- Hook navega a `/chat/12345` (abre el chat)

**Cuándo usarlo:**
- Link compartido directo a un chat
- Notificación con click → chat específico

---

### 4. Auth Callback (Ya existente)

**Patrón de Deep Link:**
```
pawtalk://auth/callback?authData={...}
```

**Qué hace:**
- App se abre después de OAuth
- Hook navega a `/auth/callback` con el auth data

---

## 🔧 Cómo Implementar en el Backend

### 1. Firebase Cloud Messaging (FCM)

Configurar notificaciones que incluyan deep links:

```python
# File: src/Service/notification_Service.py (ejemplo)

def send_new_message_notification(recipient_user_id: str, chat_id: str, sender_name: str):
    """
    Envia notificación push cuando llega un mensaje.
    """
    # Obtener FCM token del usuario
    fcm_token = db.query(Usuario).filter(Usuario.id == recipient_user_id).first().fcm_token
    
    message = messaging.Message(
        notification=messaging.Notification(
            title="Nuevo mensaje",
            body=f"{sender_name} te envió un mensaje 💬",
        ),
        webpush=messaging.WebpushConfig(
            data={
                "deepLink": f"pawtalk://notification?type=message&chatId={chat_id}",
                "chatId": str(chat_id),
            }
        ),
        android=messaging.AndroidConfig(
            data={
                "deepLink": f"pawtalk://notification?type=message&chatId={chat_id}",
                "chatId": str(chat_id),
            }
        ),
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                custom_data={
                    "deepLink": f"pawtalk://notification?type=message&chatId={chat_id}",
                    "chatId": str(chat_id),
                }
            )
        ),
        token=fcm_token,
    )
    
    response = messaging.send(message)
    print(f"✅ Notificación enviada: {response}")


def send_new_match_notification(user_id: str, chat_id: str, matched_user_name: str):
    """
    Envia notificación cuando hay un nuevo match.
    """
    fcm_token = db.query(Usuario).filter(Usuario.id == user_id).first().fcm_token
    
    message = messaging.Message(
        notification=messaging.Notification(
            title="¡Nuevo Match! 🐾",
            body=f"¡Te conectaste con {matched_user_name}!",
        ),
        webpush=messaging.WebpushConfig(
            data={
                "deepLink": f"pawtalk://new-match",
                "chatId": str(chat_id),
            }
        ),
        android=messaging.AndroidConfig(
            data={
                "deepLink": f"pawtalk://new-match",
                "chatId": str(chat_id),
            }
        ),
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                custom_data={
                    "deepLink": f"pawtalk://new-match",
                    "chatId": str(chat_id),
                }
            )
        ),
        token=fcm_token,
    )
    
    response = messaging.send(message)
    print(f"✅ Notificación de match enviada: {response}")
```

**Llamar desde el endpoint de mensajes o matches:**

```python
# File: src/Router/chat_router.py (ejemplo)

@router_Chat.post("/messages/{chat_id}")
async def send_message(chat_id: str, body: MessageRequest, current_user = Depends(get_current_user)):
    # Crear mensaje
    message = Message(...)
    db.add(message)
    db.commit()
    
    # Enviar notificación al otro usuario
    recipient = db.query(Usuario).filter(...).first()
    if recipient.fcm_token:
        await NotificationService.send_new_message_notification(
            recipient_user_id=recipient.id,
            chat_id=chat_id,
            sender_name=current_user.nombre
        )
    
    return {"status": "ok"}
```

---

## 📲 Frontend: Recibiendo Notificaciones

### 1. Instalar Firebase Messaging

```bash
npm install firebase
```

### 2. Configurar Firebase en frontend

```typescript
// File: src/services/pushNotifications.ts

import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Obtener FCM token del dispositivo
 * Llamar cuando el usuario está logueado
 */
export async function requestNotificationPermission() {
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    
    console.log("✅ FCM token obtenido:", token);
    return token;
  } catch (err) {
    console.error("❌ Error obteniendo token:", err);
    return null;
  }
}

/**
 * Manejar notificaciones en foreground (app abierta)
 */
export function setupNotificationListener() {
  onMessage(messaging, (payload) => {
    console.log("📬 Notificación recibida (foreground):", payload);
    
    // Mostrar notificación en-app (toast, banner, etc)
    const notification = payload.notification;
    const data = payload.data;
    
    // Si tiene deep link, se puede navegar automáticamente
    if (data?.deepLink) {
      console.log("🔗 Deep link en notificación:", data.deepLink);
      // El hook useDeepLink() se encargará cuando la app se abre
    }
  });
}
```

### 3. Llamar desde el componente de login

```typescript
// File: src/pages/Login.tsx o AuthCallback.tsx

import { useEffect } from "react";
import { requestNotificationPermission, setupNotificationListener } from "@/services/pushNotifications";

export default function Login() {
  useEffect(() => {
    // Una vez que el usuario está logueado
    const setupPushNotifications = async () => {
      const fcmToken = await requestNotificationPermission();
      
      if (fcmToken) {
        // Enviar token al backend para guardarlo
        await userService.updateFCMToken(fcmToken);
      }
      
      // Escuchar notificaciones en foreground
      setupNotificationListener();
    };
    
    setupPushNotifications();
  }, []);
  
  return (
    // ... resto del componente
  );
}
```

### 4. .env variables

```bash
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

---

## ✅ Resumen del Flujo

### Nuevo Mensaje

```
1. Usuario A envía mensaje a Usuario B
   ↓
2. Backend crea mensaje en BD
   ↓
3. Backend envía notificación push vía FCM con:
   - title: "Nuevo mensaje"
   - body: "Usuario A te envió un mensaje"
   - deepLink: "pawtalk://notification?type=message&chatId=123"
   ↓
4. Usuario B recibe notificación en su teléfono
   ↓
5. Usuario B hace click en la notificación
   ↓
6. Sistema abre la app con el deep link: pawtalk://notification?type=message&chatId=123
   ↓
7. Hook useDeepLink() parsea el link
   ↓
8. Frontend navega a /chat/123
   ↓
9. Usuario B ve el chat abierto con el mensaje de Usuario A ✅
```

### Nuevo Match

```
1. Usuario A y Usuario B se gustan mutuamente
   ↓
2. Backend crea Chat nuevo en BD
   ↓
3. Backend envía notificación a AMBOS con:
   - title: "¡Nuevo Match! 🐾"
   - body: "¡Te conectaste con Usuario A!"
   - deepLink: "pawtalk://new-match"
   ↓
4. Usuario hace click en la notificación
   ↓
5. Sistema abre la app con deep link: pawtalk://new-match
   ↓
6. Hook useDeepLink() navega a /
   ↓
7. Frontend muestra el Feed (donde está el nuevo chat visible)
   ↓
8. Usuario ve el nuevo match y puede abrir el chat ✅
```

---

## 🐛 Testing

### Test en Web

```bash
npm run dev
# Notificaciones no funcionan en web (requiere PWA + Service Worker)
```

### Test en Mobile

1. **Instalar APK en emulador**
   ```bash
   npm run build
   npx cap sync
   npx cap open android
   # Build y run desde Android Studio
   ```

2. **Enviar notificación de prueba desde Firebase Console:**
   - Ir a Firebase Console → Cloud Messaging
   - Crear campaña de notificación
   - Seleccionar app PawTalk
   - Agregar deep link en datos personalizados:
     ```
     deepLink: pawtalk://notification?type=message&chatId=123
     ```
   - Enviar a dispositivo/emulador

3. **Verificar en logcat:**
   ```bash
   # Terminal
   adb logcat | grep "Deep link recibido"
   # Debe mostrar: "🔗 Deep link recibido: pawtalk://notification?type=message&chatId=123"
   ```

---

## 📚 Referencias

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Capacitor App Plugin](https://capacitorjs.com/docs/apis/app)
- [Deep Links en Android](https://developer.android.com/training/app-links/deep-linking)
