import { useEffect, useState } from "react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { acceptTerms } from "@/store/slices/privacySlice";
import { privacyService, type PrivacyPolicy as PrivacyPolicyType } from "@/services/privacyService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PrivacyAcceptanceProps {
  onOpenModal: () => void;
}

export const PrivacyPolicyModal = ({
  open,
  onOpenChange,
}: PrivacyPolicyModalProps) => {
  const dispatch = useAppDispatch();
  const [policy, setPolicy] = useState<PrivacyPolicyType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    const fetchPolicy = async () => {
      setLoading(true);
      try {
        const policyData = await privacyService.getPoliticaPrivacidad();
        setPolicy(policyData);
      } catch (error) {
        console.error("Error fetching privacy policy:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [open]);

  const handleAccept = () => {
    dispatch(acceptTerms());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {policy?.Titulo || "Política de Privacidad"}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {policy?.Descripcion || "Cargando..."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto space-y-6 pr-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-muted-foreground">Cargando política de privacidad...</p>
            </div>
          ) : policy ? (
            <>
              {/* Tipo de datos obtenidos */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-3">
                  📊 Tipo de Datos Obtenidos
                </h3>
                <div className="bg-secondary/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                  {policy["Tipo de datos obtenidos"]
                    .split("\n")
                    .filter(Boolean)
                    .map((item, idx) => (
                      <p key={idx} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{item}</span>
                      </p>
                    ))}
                </div>
              </div>

              {/* Utilización de datos */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-3">
                  🔍 Utilización de Datos
                </h3>
                <div className="bg-secondary/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                  {policy["Utilización de datos"]
                    .split("\n")
                    .filter(Boolean)
                    .map((item, idx) => (
                      <p key={idx} className="flex gap-2">
                        {item.startsWith("-") ? (
                          <>
                            <span className="text-primary">•</span>
                            <span>{item.substring(1).trim()}</span>
                          </>
                        ) : (
                          <span>{item}</span>
                        )}
                      </p>
                    ))}
                </div>
              </div>

              {/* Protección de datos */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-3">
                  🛡️ Protección de Datos
                </h3>
                <div className="bg-secondary/30 rounded-lg p-4 text-sm text-muted-foreground">
                  <p>{policy["Proteccion de datos"]}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="flex gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cerrar
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
          >
            Aceptar y Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PrivacyAcceptance = ({ onOpenModal }: PrivacyAcceptanceProps) => {
  const dispatch = useAppDispatch();
  const { termsAccepted } = useSelector(
    (state: RootState) => state.privacy
  );

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      dispatch(acceptTerms());
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div className="flex items-center gap-3">
        <Checkbox
          id="privacy-acceptance"
          checked={termsAccepted}
          onCheckedChange={handleCheckboxChange}
          className="cursor-pointer"
        />
        <label className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer">
          Acepto los{" "}
          <a
            href="/legal"
            className="text-primary hover:text-primary/80 font-medium underline transition-colors cursor-pointer"
          >
            términos legales y política de privacidad
          </a>
        </label>
      </div>
    </div>
  );
};
