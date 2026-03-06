import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logoColor from "@/assets/pawtalk-logo.png";
import {
  privacyService,
  type PrivacyPolicy,
  type CSAEPolicy,
} from "@/services/privacyService";

const Legal = () => {
  const [privacy, setPrivacy] = useState<PrivacyPolicy | null>(null);
  const [csae, setCsae] = useState<CSAEPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [privacyData, csaeData] = await Promise.all([
        privacyService.getPoliticaPrivacidad(),
        privacyService.getCSAE(),
      ]);
      setPrivacy(privacyData);
      setCsae(csaeData);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      {/* Header */}
      <div className="gradient-header px-4 py-3 flex items-center gap-3 shrink-0" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <Link to="/" className="p-1">
          <ArrowLeft className="h-6 w-6 text-primary-foreground" />
        </Link>
        <div className="flex items-center gap-2">
          <img src={logoColor} alt="PawTalk" className="h-8 w-8" />
          <span className="text-xl font-extrabold text-primary-foreground italic">
            Términos Legales
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-10">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* ══ POLÍTICA DE PRIVACIDAD ══ */}
            {privacy && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  🔒 {privacy.Titulo}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {privacy.Descripcion}
                </p>

                {/* Tipo de datos */}
                <div>
                  <h3 className="font-bold text-base text-foreground mb-2">
                    📊 Tipo de Datos Obtenidos
                  </h3>
                  <div className="bg-secondary/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                    {privacy["Tipo de datos obtenidos"]
                      .split("\n")
                      .filter(Boolean)
                      .map((item, idx) => (
                        <p key={idx} className="flex gap-2">
                          <span className="text-primary shrink-0">•</span>
                          <span>{item.replace(/^-\s?/, "")}</span>
                        </p>
                      ))}
                  </div>
                </div>

                {/* Utilización */}
                <div>
                  <h3 className="font-bold text-base text-foreground mb-2">
                    🔍 Utilización de Datos
                  </h3>
                  <div className="bg-secondary/30 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
                    {privacy["Utilización de datos"]
                      .split("\n")
                      .filter(Boolean)
                      .map((item, idx) => (
                        <p key={idx} className="mb-2 last:mb-0">
                          {item.startsWith("-") ? (
                            <span className="flex gap-2">
                              <span className="text-primary shrink-0">•</span>
                              <span>{item.substring(1).trim()}</span>
                            </span>
                          ) : (
                            item
                          )}
                        </p>
                      ))}
                  </div>
                </div>

                {/* Protección */}
                <div>
                  <h3 className="font-bold text-base text-foreground mb-2">
                    🛡️ Protección de Datos
                  </h3>
                  <div className="bg-secondary/30 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
                    <p>{privacy["Proteccion de datos"]}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Separador */}
            <hr className="border-border" />

            {/* ══ CSAE ══ */}
            {csae && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  ⚖️ Estándares CSAE
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {csae.Titulo}
                </p>

                {/* Prohibiciones */}
                <div>
                  <h3 className="font-bold text-base text-foreground mb-2">
                    🚫 Prohibiciones Explícitas
                  </h3>
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
                    <p>{csae["Prohibicion explicitas"]}</p>
                  </div>
                </div>

                {/* Reporte */}
                <div>
                  <h3 className="font-bold text-base text-foreground mb-2">
                    📢 Sistema de Reporte
                  </h3>
                  <div className="bg-secondary/30 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
                    <p>{csae.Reporte}</p>
                  </div>
                </div>

                {/* Links legales */}
                <div>
                  <h3 className="font-bold text-base text-foreground mb-2">
                    📖 Más Información
                  </h3>
                  <div className="bg-secondary/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                    {csae.Final.split("\n")
                      .filter(Boolean)
                      .map((line, idx) => {
                        const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                        if (urlMatch) {
                          const label = line.replace(urlMatch[0], "").replace(/^-\s?/, "").trim();
                          return (
                            <p key={idx} className="flex gap-2 items-start">
                              <span className="text-primary shrink-0">•</span>
                              <span>
                                {label}{" "}
                                <a
                                  href={urlMatch[0]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline break-all"
                                >
                                  {urlMatch[0]}
                                </a>
                              </span>
                            </p>
                          );
                        }
                        return (
                          <p key={idx}>{line}</p>
                        );
                      })}
                  </div>
                </div>
              </section>
            )}

            {/* Footer */}
            <div className="text-center pt-4 pb-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Legal;
