import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { setTokens, setGoogleInfo, setError } from "@/store/slices/authSlice";
import logoColor from "@/assets/logo-color.png";

const AuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const processCallback = async () => {
      try {
        // Leer parámetros de la URL
        const params = new URLSearchParams(window.location.search);
        const email = params.get("email");
        const google_id = params.get("google_id");
        const error = params.get("error");

        console.log("🔍 AuthCallback - Parámetros:", { email, google_id, error });

        // Si hay error, mostrar y volver a login
        if (error) {
          console.error("❌ Error del backend:", error);
          dispatch(setError(`Error en Google: ${error}`));
          setTimeout(() => navigate("/login", { replace: true }), 2000);
          return;
        }

        // Caso 1: Usuario NUEVO (pasado en query params)
        if (email && google_id) {
          console.log("✅ Usuario nuevo detectado");
          dispatch(setGoogleInfo({ googleId: google_id, email }));
          navigate("/profile", { replace: true });
          return;
        }

        // Caso 2: Usuario EXISTENTE (token en cookie)
        // El token se envió en cookie httponly, axios lo envía automáticamente en los siguientes requests
        if (!email && !google_id) {
          console.log("✅ Usuario existente - verificando token en cookies");
          
          // Esperar un poco para que el Redux se actualice
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // El backend guardó el token en cookie, ahora podemos navegar al feed
          navigate("/feed", { replace: true });
          return;
        }

        console.warn("⚠️ No se pudo determinar el estado del usuario");
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("❌ Error en AuthCallback:", error);
        dispatch(setError("Error procesando autenticación"));
        navigate("/login", { replace: true });
      }
    };

    processCallback();
  }, [navigate, dispatch]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <img src={logoColor} alt="Therian App" className="h-20 w-20 mb-4 animate-pulse" />
      <p className="text-muted-foreground text-center">Procesando autenticación…</p>
    </div>
  );
};

export default AuthCallback;
