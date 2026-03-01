import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ArrowLeft, Send, ImagePlus, X, Reply, Trash2, AlertCircle } from "lucide-react";
import logoColor from "@/assets/logo-color.png";
import BottomNav from "@/components/BottomNav";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useChat } from "@/hooks/useChat";
import { chatService } from "@/services/chatService";
import DenunciaService from "@/services/denunciaService";
import type { Mensaje } from "@/services/chatService";

/* ═══════════════════════════════════════
   TIPOS LOCALES
   ═══════════════════════════════════════ */

interface ReplyTarget {
  id: number | string;
  contenido: string | null;
  emisorNombre: string;
  tipo?: string;
}

interface ImagePreview {
  file: File;
  url: string; // object URL para preview
}

/* ═══════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════ */

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");

  // Reply state
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Long-press menu state
  const [menuMsg, setMenuMsg] = useState<Mensaje | null>(null);

  // Image lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Report message state
  const [showReportMessageModal, setShowReportMessageModal] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<Mensaje | null>(null);
  const [denunciaData, setDenunciaData] = useState<{motivo: Array<{id_motivo_denuncia: number; nombre_motivo: string}>; tipo: Array<{id_tipo_denuncia: number; nombre_tipo_denuncia: string}>} | null>(null);
  const [selectedMotivoDenuncia, setSelectedMotivoDenuncia] = useState<number | "">("");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [notificacion, setNotificacion] = useState<{tipo: "exito" | "error"; mensaje: string} | null>(null);

  // Swipe state
  const swipeRef = useRef<{ startX: number; msgId: number | string } | null>(null);
  const [swipingMsgId, setSwipingMsgId] = useState<number | string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const auth = useAppSelector((state) => state.auth);
  const chatList = useAppSelector((state) => state.chat.chatList);
  const unreadCounts = useAppSelector((state) => state.chat.unreadCounts);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mensajes, isConnected, isLoadingHistory, enviarMensaje, enviarMensajeConReply, enviarImagen, eliminarMensaje } =
    useChat(selectedChatId);

  // Tick cada segundo para actualizar los timers de "puede eliminar"
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Clear state when switching chats
  useEffect(() => {
    setReplyTarget(null);
    setImagePreview(null);
    setMenuMsg(null);
    setLightboxUrl(null);
    setMessageInput("");
  }, [selectedChatId]);

  /* ═══ HELPERS ══════════════════════════════════════════════ */

  const selectedChat = chatList.find((c) => c.id_chat === selectedChatId);

  const filteredChats = chatList.filter((c) =>
    c.otro_usuario_nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEmisorNombre = (msg: Mensaje): string => {
    const mine = msg.id_emisor === auth.userId || msg.id_emisor === String(auth.userId);
    return mine ? "Tú" : selectedChat?.otro_usuario_nombre || "Otro";
  };

  const isMine = useCallback(
    (msg: Mensaje) =>
      msg.id_emisor === auth.userId || msg.id_emisor === String(auth.userId),
    [auth.userId]
  );

  /** Buscar mensaje citado en la lista */
  const findReplyMsg = (id: number | string | null | undefined): Mensaje | undefined => {
    if (!id) return undefined;
    return mensajes.find(
      (m) => m.id_mensaje !== undefined && (m.id_mensaje === id || String(m.id_mensaje) === String(id))
    );
  };

  const parsearFecha = (fecha: string | null | undefined): Date | null => {
    if (!fecha) return null;
    // Intentar parsear directamente (ISO 8601)
    let d = new Date(fecha);
    if (!isNaN(d.getTime())) return d;
    
    // Si no funciona, intentar con reemplazo de espacio por T
    if (typeof fecha === 'string' && fecha.includes(' ') && !fecha.includes('T')) {
      const isoFormat = fecha.replace(' ', 'T');
      d = new Date(isoFormat);
      if (!isNaN(d.getTime())) return d;
    }
    
    return null;
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "";
    const d = parsearFecha(fecha);
    if (!d) return "";
    
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (d.toDateString() === hoy.toDateString())
      return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === ayer.toDateString()) return "Ayer";
    if (d.getFullYear() === hoy.getFullYear())
      return d.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
    return d.toLocaleDateString("es-ES", { year: "2-digit", month: "short", day: "numeric" });
  };

  const formatearHoraMensaje = (fecha: string | null) => {
    if (!fecha) return "";
    const d = parsearFecha(fecha);
    if (!d) return "";
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  const truncar = (msg?: string, max = 50) =>
    !msg ? "Sin mensajes" : msg.length > max ? `${msg.substring(0, max)}...` : msg;

  /* ═══ ENVIAR MENSAJES ═════════════════════════════════════ */

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    if (replyTarget) {
      enviarMensajeConReply(messageInput, replyTarget.id);
    } else {
      enviarMensaje(messageInput);
    }
    setMessageInput("");
    setReplyTarget(null);
  };

  const handleEnviarImagen = async () => {
    if (!imagePreview || !selectedChatId) return;
    setIsUploadingImage(true);
    try {
      const uploaded = await chatService.subirImagenChat(selectedChatId, imagePreview.file);
      enviarImagen([uploaded], replyTarget?.id || null);
      setImagePreview(null);
      setReplyTarget(null);
    } catch (err) {
      console.error("Error subiendo imagen:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen no puede superar 10MB");
      return;
    }
    setImagePreview({ file, url: URL.createObjectURL(file) });
    setMessageInput(""); // No se puede escribir texto con imagen
    e.target.value = "";
  };

  const cancelImagePreview = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview.url);
    setImagePreview(null);
  };

  /* ═══ LONG PRESS ══════════════════════════════════════════ */

  const handleTouchStart = useCallback(
    (msg: Mensaje, e: React.TouchEvent) => {
      // Ignorar long-press en reply bubbles
      if ((e.target as HTMLElement).closest('[data-dont-open-menu="true"]')) return;
      longPressTimer.current = setTimeout(() => {
        setMenuMsg(msg);
      }, 500);
    },
    []
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  const handleContextMenu = useCallback(
    (msg: Mensaje, e: React.MouseEvent) => {
      e.preventDefault();
      setMenuMsg(msg);
    },
    []
  );

  const handleReplyFromMenu = () => {
    if (!menuMsg) return;
    setReplyTarget({
      id: menuMsg.id_mensaje!,
      contenido: menuMsg.tipo === "imagen" ? "Imagen" : menuMsg.contenido,
      emisorNombre: getEmisorNombre(menuMsg),
      tipo: menuMsg.tipo,
    });
    setMenuMsg(null);
  };

  const handleDeleteFromMenu = async () => {
    if (!menuMsg?.id_mensaje) return;
    setMenuMsg(null);
    await eliminarMensaje(menuMsg.id_mensaje);
  };

  const handleReportFromMenu = () => {
    if (!menuMsg) return;
    setReportingMessage(menuMsg);
    // Cargar datos de denuncia si no están cargados
    if (!denunciaData) {
      DenunciaService.obtenerDatos().then(data => {
        setDenunciaData(data);
      }).catch(err => console.error("❌ Error al cargar datos de denuncia:", err));
    }
    setShowReportMessageModal(true);
    setMenuMsg(null);
  };

  const handleReportMessage = async () => {
    if (!reportingMessage?.id_mensaje || !selectedMotivoDenuncia) {
      console.error("❌ Faltan datos para la denuncia");
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    setSubmittingReport(true);
    try {
      console.log("📤 Enviando denuncia de mensaje...", {
        id_mensaje: reportingMessage.id_mensaje,
        id_tipo_denuncia: 3, // MENSAJE tiene id 3
        id_motivo_denuncia: selectedMotivoDenuncia,
        descripcion: reportDescription,
      });

      const payload = {
        id_mensaje: Number(reportingMessage.id_mensaje),
        id_tipo_denuncia: 3, // MENSAJE
        id_motivo_denuncia: Number(selectedMotivoDenuncia),
        descripcion: reportDescription || undefined,
      };

      await DenunciaService.denunciarMensaje(payload);

      console.log("✅ Denuncia de mensaje enviada exitosamente");

      // Cerrar modal y resetear estado
      setShowReportMessageModal(false);
      setReportingMessage(null);
      setSelectedMotivoDenuncia("");
      setReportDescription("");

      // Mostrar notificación de éxito
      setNotificacion({
        tipo: "exito",
        mensaje: "Denuncia enviada con éxito. Los administradores evaluarán la revisión."
      });
      setTimeout(() => setNotificacion(null), 4000);
    } catch (error: any) {
      console.error("❌ Error al enviar denuncia:", error);
      setNotificacion({
        tipo: "error",
        mensaje: error.response?.data?.detail || "Error al enviar la denuncia. Intenta de nuevo."
      });
      setTimeout(() => setNotificacion(null), 4000);
    } finally {
      setSubmittingReport(false);
    }
  };

  const closeMenu = () => {
    setMenuMsg(null);
  };

  /** Segundos restantes para poder eliminar un mensaje propio */
  const getSecondsLeft = useCallback(
    (msg: Mensaje): number => {
      // Si ya viene del historial REST
      if (msg.tiempo_restante_segundos !== undefined && msg.tiempo_restante_segundos !== null) {
        // Restar el tiempo transcurrido desde que se cargó
        // Recalcular dinámicamente desde la fecha del mensaje
      }
      // Calcular desde la fecha del mensaje
      const d = parsearFecha(msg.fecha);
      if (!d) return 0;
      const elapsed = (Date.now() - d.getTime()) / 1000;
      return Math.max(0, 15 * 60 - elapsed);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const canDelete = useCallback(
    (msg: Mensaje): boolean => {
      if (!isMine(msg)) return false;
      if (msg.eliminado) return false;
      return getSecondsLeft(msg) > 0;
    },
    [isMine, getSecondsLeft]
  );

  const formatTimer = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ═══ SWIPE TO REPLY ══════════════════════════════════════ */

  const handleSwipeStart = (msg: Mensaje, e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeRef.current = { startX: touch.clientX, msgId: msg.id_mensaje! };
    setSwipingMsgId(msg.id_mensaje!);
    setSwipeOffset(0);
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    if (!swipeRef.current) return;
    const touch = e.touches[0];
    const diff = touch.clientX - swipeRef.current.startX;
    // Cancel long-press on any movement
    cancelLongPress();
    if (diff > 0) {
      // Right swipe → reply gesture
      setSwipeOffset(Math.min(diff, 80));
    } else {
      // Left swipe → ignore, do nothing (no menu, no offset)
      setSwipeOffset(0);
    }
  };

  const handleSwipeEnd = (msg: Mensaje) => {
    if (!swipeRef.current) return;
    if (swipeOffset > 60) {
      // Activar reply
      setReplyTarget({
        id: msg.id_mensaje!,
        contenido: msg.tipo === "imagen" ? "Imagen" : msg.contenido,
        emisorNombre: getEmisorNombre(msg),
        tipo: msg.tipo,
      });
    }
    swipeRef.current = null;
    setSwipingMsgId(null);
    setSwipeOffset(0);
  };

  /* ═══ REPLY BUBBLE (dentro de un mensaje) ═════════════════ */

  const ReplyBubble = ({ msg, mine }: { msg: Mensaje; mine: boolean }) => {
    // Usar mensaje_reply si viene del historial REST, de lo contrario buscar en array (WS)
    const original = msg.mensaje_reply || findReplyMsg(msg.id_mensaje_reply);
    if (!original) return null;
    
    const isOriginalMine = original.id_emisor === auth.userId || original.id_emisor === String(auth.userId);
    const nombre = isOriginalMine ? "Tú" : selectedChat?.otro_usuario_nombre || "";
    const preview =
      original.tipo === "imagen"
        ? "Imagen"
        : original.contenido
        ? original.contenido.length > 60
          ? original.contenido.substring(0, 60) + "..."
          : original.contenido
        : "";

    return (
      <div
        data-dont-open-menu="true"
        className={`rounded-lg px-3 py-1.5 mb-1 border-l-4 text-xs cursor-pointer ${
          mine
            ? "bg-primary/20 border-primary/60 text-primary-foreground/80"
            : "bg-muted border-muted-foreground/40 text-muted-foreground"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          const el = document.getElementById(`msg-${original.id_mensaje}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-primary");
            setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1500);
          }
        }}
      >
        <p className="font-semibold text-[11px]">{nombre}</p>
        <p className="truncate">{preview}</p>
      </div>
    );
  };

  /* ═══ VISTA CONVERSACIÓN ══════════════════════════════════ */

  if (selectedChatId !== null && selectedChat) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden" style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}>
        {/* ── Image Lightbox ── */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <img
              src={lightboxUrl}
              alt="Imagen"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* ── Header / Context Menu Overlay ── */}
        {menuMsg ? (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 z-40" onClick={closeMenu} />
            {/* Menu bar cubriendo el header */}
            <div className="gradient-header px-4 py-3 flex items-center justify-between shrink-0 z-50 relative">
              <button onClick={closeMenu} className="p-1">
                <X className="h-6 w-6 text-primary-foreground" />
              </button>
              <div className="flex items-center gap-3">
                {/* Botón responder */}
                {!menuMsg.eliminado && (
                  <button
                    onClick={handleReplyFromMenu}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                  >
                    <Reply className="h-5 w-5 text-primary-foreground" />
                    <span className="text-sm font-medium text-primary-foreground">Responder</span>
                  </button>
                )}
                {/* Botón eliminar — solo para mensajes propios dentro de los 15 min */}
                {canDelete(menuMsg) && (
                  <button
                    onClick={handleDeleteFromMenu}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/70 hover:bg-red-500/90 transition-colors"
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                    <span className="text-sm font-medium text-white">
                      Eliminar ({formatTimer(getSecondsLeft(menuMsg))})
                    </span>
                  </button>
                )}
                {/* Botón denunciar - para cualquier mensaje */}
                {!menuMsg.eliminado && (
                  <button
                    onClick={handleReportFromMenu}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/70 hover:bg-amber-500/90 transition-colors"
                  >
                    <AlertCircle className="h-5 w-5 text-white" />
                    <span className="text-sm font-medium text-white">Denunciar</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="gradient-header px-4 py-3 flex items-center justify-between shrink-0">
            <button
              onClick={() => setSelectedChatId(null)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="h-6 w-6 text-primary-foreground" />
              {selectedChat.imagen_url ? (
                <img
                  src={selectedChat.imagen_url}
                  alt={selectedChat.otro_usuario_nombre}
                  className="h-9 w-9 rounded-full border border-primary-foreground/30 object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary-foreground/20 shrink-0 flex items-center justify-center text-xs">
                  👤
                </div>
              )}
              <span className="text-xl font-bold text-primary-foreground">
                {selectedChat.otro_usuario_nombre}
              </span>
            </button>
          </div>
        )}

        {/* ── Messages Area ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col" style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}>
          {isLoadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Cargando mensajes...</p>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Sin mensajes aún</p>
              <p className="text-xs text-muted-foreground mt-1">¡Empieza la conversación!</p>
            </div>
          ) : (
            <>
              {mensajes.map((msg) => {
                const mine = isMine(msg);
                const isSwipingThis = swipingMsgId === msg.id_mensaje;
                const offset = isSwipingThis ? swipeOffset : 0;

                return (
                  <div
                    key={`msg-${msg.id_mensaje}`}
                    id={`msg-${msg.id_mensaje}`}
                    className={`flex ${mine ? "justify-end" : "justify-start"} transition-all duration-200 relative`}
                    style={{ transform: offset > 0 ? `translateX(${offset}px)` : undefined }}
                    onTouchStart={(e) => {
                      if (msg.eliminado || (e.target as HTMLElement).closest('[data-dont-open-menu="true"]')) return;
                      handleTouchStart(msg, e);
                      handleSwipeStart(msg, e);
                    }}
                    onTouchMove={handleSwipeMove}
                    onTouchEnd={() => {
                      handleTouchEnd();
                      handleSwipeEnd(msg);
                    }}
                    onContextMenu={(e) => {
                      if (msg.eliminado) return;
                      handleContextMenu(msg, e);
                    }}
                  >
                    {/* Reply indicator al swipear */}
                    {offset > 30 && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-60">
                        <Reply className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      } ${menuMsg?.id_mensaje === msg.id_mensaje ? "ring-2 ring-primary scale-[1.02]" : ""}`}
                    >
                      {/* Reply bubble */}
                      {msg.id_mensaje_reply && !msg.eliminado && (
                        <ReplyBubble msg={msg} mine={mine} />
                      )}

                      {/* Mensaje eliminado */}
                      {msg.eliminado ? (
                        <p className={`text-sm italic opacity-50 ${mine ? "text-primary-foreground" : "text-foreground"}`}>
                          Mensaje eliminado
                        </p>
                      ) : msg.tipo === "imagen" && msg.imagenes && msg.imagenes.length > 0 ? (
                        /* Imagen */
                        <div className="space-y-1">
                          {msg.imagenes.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.url}
                              alt="Imagen"
                              className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer"
                              onClick={() => setLightboxUrl(img.url)}
                            />
                          ))}
                        </div>
                      ) : (
                        /* Texto */
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.contenido}
                        </p>
                      )}

                      {/* Hora + timer borrado */}
                      <div className={`flex items-center justify-end gap-1.5 mt-0.5 ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {!msg.eliminado && mine && canDelete(msg) && (
                          <span className="text-[9px] font-mono opacity-60">
                            {formatTimer(getSecondsLeft(msg))}
                          </span>
                        )}
                        <p className="text-[10px]">
                          {formatearHoraMensaje(msg.fecha)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ── Image Preview (cuando hay imagen seleccionada) ── */}
        {imagePreview && (
          <div className="border-t border-border bg-background p-4 shrink-0">
            <div className="relative inline-block">
              <img
                src={imagePreview.url}
                alt="Preview"
                className="max-h-48 rounded-xl object-contain border border-border"
              />
              <button
                onClick={cancelImagePreview}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleEnviarImagen}
                disabled={isUploadingImage || !isConnected}
                className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {isUploadingImage ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar imagen
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Reply Banner ── */}
        {replyTarget && !imagePreview && (
          <div className="border-t border-border bg-secondary/50 px-4 py-2 flex items-center gap-3 shrink-0">
            <div className="w-1 h-10 bg-primary rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary">{replyTarget.emisorNombre}</p>
              <p className="text-xs text-muted-foreground truncate">
                {replyTarget.tipo === "imagen" ? "Imagen" : replyTarget.contenido}
              </p>
            </div>
            <button onClick={() => setReplyTarget(null)} className="shrink-0 p-1 hover:bg-secondary rounded-full">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* ── Input Area (oculto cuando hay imagen preview) ── */}
        {!imagePreview && (
          <div className="border-t border-border p-3 shrink-0">
            <form onSubmit={handleEnviar} className="flex items-center gap-2">
              {/* Botón de imagen (solo si no hay texto) */}
              {!messageInput.trim() && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isConnected}
                    className="p-2.5 rounded-full text-muted-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </>
              )}

              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2.5 rounded-full bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!isConnected || !messageInput.trim()}
                className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            {!isConnected && (
              <p className="text-xs text-muted-foreground mt-1 text-center">Conectando...</p>
            )}
          </div>
        )}

        {/* ── Report Message Modal ── */}
        {showReportMessageModal && reportingMessage && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !submittingReport && setShowReportMessageModal(false)}
          >
            <div 
              className="bg-background rounded-3xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-foreground">Denunciar Mensaje</h2>
                <button
                  onClick={() => !submittingReport && setShowReportMessageModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Tipo de Denuncia - MENSAJE (solo lectura) */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider">
                    Tipo de denuncia
                  </label>
                  <div className="w-full px-4 py-3 rounded-lg bg-secondary border border-secondary-foreground/20 text-foreground">
                    MENSAJE
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Este tipo de denuncia está predeterminado para mensajes</p>
                </div>

                {/* Motivo de Denuncia */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider">
                    Motivo de denuncia
                  </label>
                  <select
                    value={selectedMotivoDenuncia}
                    onChange={(e) => setSelectedMotivoDenuncia(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-secondary-foreground/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecciona motivo...</option>
                    {denunciaData?.motivo?.map((motivo) => (
                      <option key={motivo.id_motivo_denuncia} value={motivo.id_motivo_denuncia}>
                        {motivo.nombre_motivo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Cuéntanos más sobre por qué denuncias este mensaje..."
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-secondary-foreground/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={4}
                    disabled={submittingReport}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportDescription.length}/500
                  </p>
                </div>

                {/* Preview del mensaje denunciado */}
                <div className="bg-secondary/50 rounded-2xl px-4 py-3">
                  <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Mensaje a denunciar:</p>
                  <p className="text-sm text-foreground break-words">
                    {reportingMessage.tipo === "imagen" ? "Imagen" : reportingMessage.contenido}
                  </p>
                </div>

                {/* Botones */}
                <div className="pt-4 space-y-2 flex gap-3">
                  <button
                    onClick={() => setShowReportMessageModal(false)}
                    disabled={submittingReport}
                    className="flex-1 px-4 py-3 border-2 border-secondary-foreground/30 rounded-lg text-foreground font-bold hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReportMessage}
                    disabled={!selectedMotivoDenuncia || submittingReport}
                    className="flex-1 px-4 py-3 bg-destructive rounded-lg text-destructive-foreground font-bold hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submittingReport ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Enviando...
                      </>
                    ) : (
                      "Denunciar"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Notificación de Denuncia ── */}
        {notificacion && (
          <div 
            className={`fixed top-4 left-4 right-4 max-w-md mx-auto z-50 px-5 py-4 rounded-2xl shadow-2xl border-2 transition-all duration-300 ${
              notificacion.tipo === "exito"
                ? "bg-green-500 border-green-600 text-white"
                : "bg-red-500 border-red-600 text-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {notificacion.tipo === "exito" ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-white">
                  {notificacion.tipo === "exito" ? "Denuncia Enviada" : "❌ Error en Denuncia"}
                </p>
                <p className="text-sm text-white/95 mt-1 leading-snug">
                  {notificacion.mensaje}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══ VISTA LISTA DE CHATS ════════════════════════════════ */

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden" style={{ touchAction: 'manipulation', overscrollBehaviorX: 'none' }}>
      <div className="gradient-header px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoColor} alt="PawTalk" className="h-10 w-10" />
          <span className="text-2xl font-extrabold text-primary-foreground italic">PawTalk</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar conversación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {chatList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Cargando chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl">💬</p>
            <p className="text-muted-foreground mt-2 font-semibold">No hay conversaciones</p>
            <p className="text-muted-foreground text-sm mt-1">¡Haz match para empezar a chatear!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredChats.map((chat) => {
              const unread = unreadCounts[chat.id_chat] || 0;
              const lastMessage = chat.contenido_mensaje || chat.ultimo_mensaje || "Sin mensajes";
              return (
                <button
                  key={`chat-${chat.id_chat}`}
                  onClick={() => setSelectedChatId(chat.id_chat)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/60 transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    {chat.imagen_url ? (
                      <img
                        src={chat.imagen_url}
                        alt={chat.otro_usuario_nombre}
                        className="h-14 w-14 rounded-full border-2 border-border object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full border-2 border-border bg-secondary flex items-center justify-center text-muted-foreground">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold truncate text-foreground">
                        {chat.otro_usuario_nombre}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatearFecha(chat.fecha_ultimo_mensaje)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={`text-sm truncate ${
                          unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {truncar(lastMessage, 50)}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 shrink-0 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
