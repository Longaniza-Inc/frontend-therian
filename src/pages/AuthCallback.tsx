import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logoColor from "@/assets/logo-color.png";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processCallback = async () => {
      try {
        console.log("📍 AuthCallback - Leyendo datos de URL params...");
        
        // Leer datos de query params
        const params = new URLSearchParams(window.location.search);
        const authError = params.get("authError");
        const authDataJson = params.get("authData");
        
        console.log("🔍 URL params:", {
          authError: !!authError,
          authData: !!authDataJson,
          url: window.location.href
        });

        // Si hay error del backend
        if (authError) {
          console.error("❌ Error del backend:", authError);
          // Mostrar error y redirigir a login
          await new Promise(resolve => setTimeout(resolve, 2000));
          navigate("/login", { replace: true });
          return;
        }

        if (!authDataJson) {
          throw new Error("No se encontraron datos de autenticación en URL");
        }

        // Parsear el JSON
        const authData = JSON.parse(authDataJson);
        console.log("✅ Datos parseados:", {
          is_new_user: authData.is_new_user,
          email: authData.email,
          has_token: !!authData.access_token,
        });

        // Guardar en localStorage para que useAuth lo lea
        localStorage.setItem("authData", JSON.stringify(authData));
        
        // Llamar handleGoogleCallback que lee de localStorage
        const result = await handleGoogleCallback();
        console.log("✅ Callback procesado:", result);

        // Esperar a que Redux se actualice
        await new Promise(resolve => setTimeout(resolve, 500));

        if (result.isNewUser) {
          console.log("➡️ Redirigiendo a /create-profile (usuario nuevo)");
          navigate("/create-profile", { replace: true });
        } else {
          console.log("➡️ Redirigiendo a /feed (usuario existente)");
          navigate("/feed", { replace: true });
        }
      } catch (error) {
        console.error("❌ Error en AuthCallback:", error);
        navigate("/login", { replace: true });
      }
    };

    processCallback();
  }, [navigate, handleGoogleCallback]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <img src={logoColor} alt="Therian App" className="h-20 w-20 mb-4 animate-pulse" />
      <p className="text-muted-foreground text-center">Procesando autenticación…</p>
    </div>
  );
};

export default AuthCallback;
