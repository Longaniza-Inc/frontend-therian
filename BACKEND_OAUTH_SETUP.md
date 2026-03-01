
---

## ✅ Testing

### Testar en Web

```bash
# Terminal 1: Backend
python -m uvicorn main:app --reload

# Terminal 2: Frontend (vite dev)
npm run dev

# Abre: http://localhost:8080/login
# Presiona "Login con Google"
# Verifica en backend logs que dice: "✅ State decodificado: client_type=web"
# Espera el redirect a /auth/callback
```

### Testar en Mobile (Emulador Android)

```bash
# Primero, build y sync
npm run cap:sync

# O abre en Android Studio
npm run cap:android

# En el emulador, presiona "Login con Google"
# Verifica en backend logs que dice: "✅ State decodificado: client_type=mobile"
# El deep link debe redirigir a la app correctamente
```

---

## 🐛 Troubleshooting

**El state JWT no se decodifica:**

Verifica que:
1. `SECRET_KEY` es la misma en `login_google()` y `google_callback()`
2. El JWT aún no ha expirado (válido por 10 minutos)
3. Instalaste `pyjwt`: `pip install pyjwt`

```bash
pip install pyjwt
```

**Si el deep link no funciona en mobile:**

1. Verifica en logcat que el backend devuelve: `pawtalk://auth/callback?authData=...`
   (no HTTP)

2. Verifica que `AndroidManifest.xml` tenga el intent filter:
   ```xml
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="pawtalk" android:host="*" />
   </intent-filter>
   ```

3. Asegúrate de que la URL está correctamente encoded con `urlencode()`

4. En Android Studio logcat, busca: `Deep link recibido:` en la salida

---

## 📄 Referencias

- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)

