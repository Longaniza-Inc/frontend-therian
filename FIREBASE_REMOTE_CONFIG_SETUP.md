# 🔥 Configuración de Firebase Remote Config para Control de Versiones

## ✅ Pasos Completados

1. ✅ **build.gradle actualizado**: versionCode `5`, versionName `"1.4"`
2. ✅ **Firebase SDK instalado**: `npm install firebase`
3. ✅ **Servicio creado**: `src/services/remoteConfigService.ts`
4. ✅ **Modal de actualización**: `src/components/UpdateRequiredModal.tsx`
5. ✅ **Hook de verificación**: `src/hooks/useVersionCheck.ts`
6. ✅ **Integración en App**: `src/App.tsx`

---

## 🚨 IMPORTANTE: Configurar Firebase

### 1️⃣ Obtener las credenciales de Firebase

Ve a la [Firebase Console](https://console.firebase.google.com/):

1. Selecciona tu proyecto **PawTalk**
2. Ve a **Project Settings** (⚙️ > Configuración del proyecto)
3. En la sección **Your apps**, selecciona tu app de Android
4. Busca la sección **SDK setup and configuration**
5. Copia el objeto `firebaseConfig`

### 2️⃣ Actualizar `remoteConfigService.ts`

Abre `src/services/remoteConfigService.ts` y reemplaza el `firebaseConfig` con tus credenciales reales:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abc123def456",
};
```

---

## 📱 Configurar Remote Config en Firebase Console

### 3️⃣ Crear el parámetro en Firebase Console

1. Ve a **Firebase Console** → **Remote Config**
2. Haz clic en **Add parameter**
3. Configura el parámetro:
   - **Parameter key**: `version_minima`
   - **Default value**: `"1.3"` (versión mínima actual)
   - **Data type**: String
   - **Description**: "Versión mínima requerida de la app"
4. Haz clic en **Publish changes**

---

## 🎯 Cómo Funciona

### Flujo de Verificación

1. **Al abrir la app** → Se ejecuta `useVersionCheck()`
2. **Se conecta a Firebase** → Obtiene `version_minima` (ej: `"1.3"`)
3. **Compara versiones**:
   - **Versión actual** (definida en `useVersionCheck.ts`): `"1.3"`
   - **Versión mínima** (desde Firebase): `"1.3"`
4. **Si actual < mínima** → Muestra modal bloqueante
5. **Si actual >= mínima** → Continúa normalmente

---

## 🔄 Cuando Subas una Nueva Versión a Play Store

### Ejemplo: Subir versión 1.4

#### 1. Actualizar el código:

**`android/app/build.gradle`**:
```gradle
versionCode 5
versionName "1.4"
```

**`src/hooks/useVersionCheck.ts`**:
```typescript
const VERSION_ACTUAL = "1.4"; // ⬅️ Actualizar aquí
```

#### 2. Compilar y subir a Play Store:
```bash
npm run build
npx cap sync android
# Abrir Android Studio y generar APK/AAB firmado
```

#### 3. Después de aprobar en Play Store:
- Ve a **Firebase Console** → **Remote Config**
- Cambia `version_minima` de `"1.3"` a `"1.4"`
- Haz clic en **Publish changes**
- ✨ **EFECTO INSTANTÁNEO**: Todos los usuarios con versión < 1.4 verán el modal

---

## 🎨 Modal de Actualización

El modal muestra:
- ✅ Logo de PawTalk
- ✅ Mensaje personalizado con tu branding
- ✅ Botón que abre la Play Store directamente
- ✅ **No se puede cerrar** (obligatorio actualizar)

Link de Play Store configurado:
```
https://play.google.com/store/apps/details?id=com.longanizainc.pawtalk
```

---

## 🧪 Pruebas

### Probar el flujo completo:

1. **En `useVersionCheck.ts`**, cambia temporalmente:
   ```typescript
   const VERSION_ACTUAL = "1.2"; // Simular versión vieja
   ```

2. Ejecuta la app:
   ```bash
   npm run dev
   ```

3. Deberías ver el modal de actualización

4. Restaura la versión real después de probar

---

## 🌐 Solo funciona en móvil

El sistema **solo se activa en plataformas nativas** (Android/iOS):

```typescript
if (!Capacitor.isNativePlatform()) {
  // En web → No verifica versión
  return;
}
```

---

## 📝 Notas Importantes

- ⚡ **Cambios instantáneos**: Firebase Remote Config actualiza en segundos
- 🔒 **Seguro**: Si Firebase falla, no bloquea la app (valor por defecto: `"1.3"`)
- 🚀 **Rápido**: Caché de 1 hora (configurable en `remoteConfigService.ts`)
- 📊 **Logs en consola**: Todos los pasos se registran para debugging

---

## 🔧 Personalización

### Cambiar intervalo de actualización:

En `remoteConfigService.ts`:
```typescript
remoteConfig.settings = {
  minimumFetchIntervalMillis: 3600000, // 1 hora (en producción)
  // Para desarrollo, usa: 60000 (1 minuto)
};
```

### Cambiar mensaje del modal:

Edita `src/components/UpdateRequiredModal.tsx`

---

## ✅ Checklist Final

- [ ] Obtener credenciales de Firebase Console
- [ ] Actualizar `firebaseConfig` en `remoteConfigService.ts`
- [ ] Crear parámetro `version_minima` en Firebase Console
- [ ] Publicar parámetro con valor `"1.3"`
- [ ] Probar cambiando `VERSION_ACTUAL` a `"1.2"`
- [ ] Verificar que el modal aparece correctamente
- [ ] Restaurar `VERSION_ACTUAL` a `"1.3"`
- [ ] Compilar APK firmado cuando estés listo

---

¡Todo listo! 🎉 Ahora tienes control total sobre las versiones de tu app desde Firebase Console.
