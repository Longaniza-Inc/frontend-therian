# Configuración de Deep Links en Capacitor

## Qué son los Deep Links

Los deep links permiten que la app nativa (Android/iOS) abra rutas específicas dentro de la aplicación usando URLs personalizadas.

Ej: `pawtalk://auth/callback?token=abc123` abre directamente la ruta `/auth/callback?token=abc123` en la app

## Configuración en Android

### 1. Editar AndroidManifest.xml

El archivo se encuentra en: `android/app/src/main/AndroidManifest.xml`

Agrega intent filters al MainActivity de tu app para manejar los deep links:

```xml
<activity
  android:name=".MainActivity"
  android:label="@string/title_activity_main"
  android:theme="@style/AppTheme"
  android:launchMode="singleTask"
  android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
  android:exported="true">

  <!-- Intent filter para HTTP/HTTPS URLs (OAuth callbacks) -->
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="pawtalk.app" />
  </intent-filter>

  <!-- Intent filter para deep links personalizados -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="pawtalk" android:host="*" />
  </intent-filter>

  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
</activity>
```

### 2. Configuración en capacitor.config.ts

Ya está configurado. Las variables de entorno que controlan el deep link son:

```typescript
const APP_DEEPLINK_SCHEME = process.env.VITE_APP_DEEPLINK_SCHEME || "pawtalk";
```

## Configuración en iOS

Para iOS, edita `ios/App/App/Info.plist` y agrega:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLName</key>
    <string>com.pawtalk.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>pawtalk</string>
    </array>
  </dict>
</array>
```

## Uso en la Aplicación

El hook `useDeepLink()` (importado en `App.tsx`) maneja automáticamente los deep links recibidos y navega a la ruta correspondiente:

```typescript
// Si el usuario abre: pawtalk://auth/callback?token=abc123
// La app automáticamente navega a: /auth/callback?token=abc123
```

## OAuth Callback con Deep Links

Si tu backend devuelve una URL HTTP cuando debería devolver un deep link:

**Frontend web (desarrollo):**
```
https://localhost:8080/auth/callback?token=abc123
```

**Frontend mobile:**
```
pawtalk://auth/callback?token=abc123
```

**Solución en el backend:**
El backend debería detectar si es una solicitud desde la app mobile y devolver el deep link en lugar de la URL HTTP. Puedes pasar un parámetro `client_type=mobile` al iniciar OAuth.

## Cambiar el Esquema del Deep Link

Para cambiar de `pawtalk://` a otro esquema (ej: `myapp://`):

1. **Editar `.env.example` y `.env`:**
   ```
   VITE_APP_DEEPLINK_SCHEME=myapp
   ```

2. **Editar `AndroidManifest.xml`:**
   ```xml
   <data android:scheme="myapp" android:host="*" />
   ```

3. **Editar `Info.plist` en iOS:**
   ```xml
   <string>myapp</string>
   ```

4. **Rebuild y sync:**
   ```bash
   npm run cap:sync
   ```
