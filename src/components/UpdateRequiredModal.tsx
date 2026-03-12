import { AlertCircle } from "lucide-react";
import logoColor from "@/assets/pawtalk-logo.png";

interface UpdateRequiredModalProps {
  visible: boolean;
}

const UpdateRequiredModal = ({ visible }: UpdateRequiredModalProps) => {
  if (!visible) return null;

  const handleUpdate = () => {
    // Abrir la Play Store en la página de la app
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.longanizainc.pawtalk";
    window.open(playStoreUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[90%] max-w-md rounded-3xl bg-card p-8 shadow-2xl border border-border animate-in fade-in zoom-in duration-300">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logoColor} alt="PawTalk" className="h-20 w-20" />
        </div>

        {/* Icono de alerta */}
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-destructive/20 p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-center text-2xl font-extrabold text-foreground mb-3">
          Actualización Necesaria
        </h2>

        {/* Mensaje */}
        <p className="text-center text-muted-foreground mb-6 leading-relaxed">
          Hay una nueva versión de <span className="font-bold text-primary">PawTalk</span> disponible. 
          Para seguir disfrutando de todas las funciones y mejoras, actualiza ahora desde la Play Store.
        </p>

        {/* Botón de actualización */}
        <button
          onClick={handleUpdate}
          className="w-full rounded-2xl gradient-primary py-4 text-lg font-bold text-white shadow-soft hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Actualizar Ahora
        </button>

        {/* Nota informativa */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Esta actualización es obligatoria para continuar usando la app
        </p>
      </div>
    </div>
  );
};

export default UpdateRequiredModal;
