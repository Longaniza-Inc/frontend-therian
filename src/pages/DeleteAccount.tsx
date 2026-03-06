import { useEffect, useState } from "react";
import logoColor from "@/assets/pawtalk-logo.png";
import { useToast } from "@/hooks/use-toast";

const DeleteAccount = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "redirecting" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Al montar, obtener URL de OAuth y redirigir
  useEffect(() => {
    const initiateDeletion = async () => {
      try {
        // Chequear si ya volvimos del callback con deleted=true
        const params = new URLSearchParams(window.location.search);
        const authDataStr = params.get("authData");

        if (authDataStr) {
          try {
            const authData = JSON.parse(authDataStr);
            if (authData.deleted === true) {
              setStatus("success");
              toast({
                title: "✅ Cuenta Eliminada",
                description: "Tu cuenta ha sido eliminada correctamente.",
              });
              // Redirigir a login después de 3 segundos
              setTimeout(() => {
                window.location.href = "/login";
              }, 3000);
              return;
            }
          } catch (e) {
            console.error("Error parseando authData:", e);
          }
        }

        // Si no hay authData deleted, obtener URL de OAuth
        setStatus("redirecting");
        const oauthParams = new URLSearchParams({
          client_type: "web",
          delete_account: "true",
        });
        const apiUrl = `${import.meta.env.VITE_BACKEND_URL}/auth/google/login?${oauthParams.toString()}`;
        console.log("🔐 Obteniendo URL de OAuth desde:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers.get("content-type"));

        if (!response.ok) {
          const text = await response.text();
          console.error("Error response:", text.substring(0, 200));
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const text = await response.text();
          console.error("Respuesta no es JSON:", text.substring(0, 200));
          throw new Error("El servidor no devolvió JSON válido. Revisa el backend.");
        }

        const { url } = await response.json();

        if (!url) {
          throw new Error("No se recibió URL de Google OAuth");
        }

        console.log("✅ URL de OAuth obtenida, redirigiendo...");
        // Redirigir a Google OAuth
        window.location.href = url;
      } catch (error: any) {
        console.error("Error iniciando eliminación:", error);
        setStatus("error");
        setErrorMessage(error?.message || "Error al conectar con Google. Intenta nuevamente.");
      }
    };

    initiateDeletion();
  }, [toast]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10 safe-top">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <img src={logoColor} alt="Therian App" className="h-24 w-24 mb-3" />
        <h1 className="text-3xl font-extrabold text-primary">PawTalk</h1>
        <p className="mt-1 text-sm text-muted-foreground">Talk to the Paw!</p>
      </div>

      {/* Content */}
      <div className="w-full max-w-sm space-y-6">
        {status === "loading" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Preparando eliminación...</h2>
              <p className="text-muted-foreground text-sm">Por favor espera mientras cargamos el proceso de autenticación</p>
            </div>
            <div className="flex justify-center py-8">
              <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          </>
        )}

        {status === "redirecting" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Redirigiendo a Google...</h2>
              <p className="text-muted-foreground text-sm">Serás redirigido a Google para autorizar la eliminación de tu cuenta</p>
            </div>
            <div className="flex justify-center py-8">
              <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          </>
        )}

        {status === "success" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-500/20 p-4 rounded-full">
                <svg
                  className="h-16 w-16 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-500">¡Cuenta Eliminada!</h2>
            <p className="text-muted-foreground">
              Tu cuenta de PawTalk ha sido eliminada correctamente. Serás redirigido en unos momentos...
            </p>
            <div className="pt-4">
              <div className="flex justify-center">
                <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-destructive/20 p-4 rounded-full">
                <svg
                  className="h-16 w-16 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-destructive">Error</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="w-full mt-4 rounded-2xl border border-input bg-secondary/50 py-3 text-foreground font-bold shadow-card hover:bg-accent active:scale-[0.98] transition-all"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Warning Info */}
        {(status === "loading" || status === "redirecting") && (
          <div className="bg-destructive/10 rounded-lg p-4 text-sm text-destructive border border-destructive/20">
            <p className="font-semibold mb-2">⚠️ Aviso Importante</p>
            <p>
              Al eliminar tu cuenta, se borrarán permanentemente todos tus datos, mensajes, imágenes y
              perfil. Esta acción no se puede deshacer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteAccount;
