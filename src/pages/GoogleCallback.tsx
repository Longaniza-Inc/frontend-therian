import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppDispatch";
import logoColor from "@/assets/logo-color.png";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const calledRef = useRef(false);

  useEffect(() => {
    // Prevent double-call in StrictMode
    if (calledRef.current) return;
    calledRef.current = true;

    // El backend ya hizo el callback y procesó el código
    // Solo verificamos qué estado tiene el usuario ahora
    const checkAuthState = async () => {
      try {
        console.log("📍 GoogleCallback - Estado actual:", {
          hasTokens: !!auth.tokens,
          hasGoogleInfo: !!auth.googleId,
          googleId: auth.googleId,
          email: auth.email,
          isAuthenticated: auth.isAuthenticated
        });
        
        // Esperar un poco para que Redux se actualice
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (auth.googleId && auth.email && !auth.tokens) {
          // Usuario nuevo - ir a crear perfil
          console.log("✅ Usuario nuevo - googleId:", auth.googleId);
          navigate("/create-profile", { replace: true });
        } else if (auth.tokens) {
          // Usuario existente - ir al feed
          console.log("✅ Usuario existente con token");
          navigate("/feed", { replace: true });
        } else {
          console.warn("⚠️ Estado no determinado, volviendo a login");
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("❌ Error:", error);
        navigate("/login", { replace: true });
      }
    };

    checkAuthState();
  }, [navigate, auth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <img src={logoColor} alt="Therian App" className="h-20 w-20 mb-4 animate-pulse" />
      <p className="text-muted-foreground text-center">Procesando autenticación…</p>
    </div>
  );
};

export default GoogleCallback;
