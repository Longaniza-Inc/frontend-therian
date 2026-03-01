import { useState, useRef, TouchEvent, useEffect } from "react";
import { Undo2, X, ThumbsUp, SlidersHorizontal, Bell, MapPin } from "lucide-react";
import logoColor from "@/assets/pawtalk-logo.png";
import reportarIcon from "@/assets/reportar.png";
import BottomNav from "@/components/BottomNav";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppDispatch";
import FeedService from "@/services/feedService";
import DenunciaService from "@/services/denunciaService";
import { setFeedCards, setCurrentIndex as setFeedIndex, setFilterOptions as setReduxFilterOptions, setRefreshing, setFeedError } from "@/store/slices/feedSlice";
import type { FeedCard, SwipeAction, SwipePayload } from "@/types";

const MOCK_CARDS: FeedCard[] = [
  {
    id: "1",
    name: "Zorrito",
    age: 63,
    therianType: "zorro",
    bio: "Holaaa, soy Zorrito y me gusta comer patas y esas cosas...",
    photos: [
      "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=800&fit=crop",
    ],
    descriptionSections: [
      { title: "Sobre mi", content: "Holaaa, soy Zorrito y me gusta comer patas y esas cosas..." },
      { title: "Pasatiempos", content: "Me encanta correr por los bosques y explorar lugares nuevos 🌲" },
      { title: "Gustos", content: "Música indie, atardeceres, y los días de lluvia 🌧️" },
    ],
  },
  {
    id: "2",
    name: "Luna",
    age: 22,
    therianType: "lobo",
    bio: "Aullando a la luna desde que tengo memoria 🌙",
    photos: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=800&fit=crop",
    ],
    descriptionSections: [
      { title: "Sobre mi", content: "Aullando a la luna desde que tengo memoria 🌙" },
      { title: "Pasatiempos", content: "Senderismo nocturno y observar las estrellas ✨" },
      { title: "Gustos", content: "Noches frías, manadas y la libertad del viento 🐺" },
    ],
  },
  {
    id: "3",
    name: "Maple",
    age: 19,
    therianType: "zorro",
    bio: "Amante de la naturaleza y los bosques 🌲",
    photos: [
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=800&fit=crop",
    ],
    descriptionSections: [
      { title: "Sobre mi", content: "Amante de la naturaleza y los bosques 🌲" },
      { title: "Pasatiempos", content: "Dibujar, leer manga y pasear al amanecer 🌅" },
    ],
  },
];

const THERIAN_EMOJIS: Record<string, string> = {
  zorro: "🦊",
  lobo: "🐺",
  no_therian: "🙂",
  apoyo: "💚",
};

async function sendSwipeAction(payload: SwipePayload, liker_id: number): Promise<void> {
  console.log("📤 Swipe action:", payload);
  
  if (payload.action === "like") {
    try {
      const liked_id = parseInt(payload.targetUserId);
      const result = await FeedService.likear(liker_id, liked_id, true);
      
      if (result.hubo_match) {
        console.log("🔥 ¡MATCH! id_match:", result.id_match, "id_chat:", result.id_chat);
        // TODO: Mostrar notificación de match
      } else {
        console.log("👍 Like enviado al usuario:", liked_id);
      }
    } catch (error) {
      console.error("❌ Error al enviar like:", error);
    }
  } else if (payload.action === "dislike") {
    console.log("👎 Dislike a usuario:", payload.targetUserId);
    // TODO: Implementar dislike en backend si es necesario
  }
}

/**
 * Transformar datos del backend a FeedCard
 */
function transformBackendUserToFeedCard(user: any): FeedCard {
  console.log("🔄 Transformando usuario del backend:", user);
  
  // Manejar imágenes: puede ser array de URLs o array de objetos
  let photoUrls: string[] = [];
  if (user.imagen && Array.isArray(user.imagen)) {
    photoUrls = user.imagen
      .map((img: any) => typeof img === 'string' ? img : img?.url)
      .filter((url: string | undefined) => url && url.length > 0);
  } else if (user.imagenes && Array.isArray(user.imagenes)) {
    photoUrls = user.imagenes
      .map((img: any) => typeof img === 'string' ? img : img?.url)
      .filter((url: string | undefined) => url && url.length > 0);
  }
  
  // Si no hay imágenes, usar placeholder
  if (photoUrls.length === 0) {
    photoUrls = ["https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=600&h=800&fit=crop"];
  }
  
  // Manejar etiquetas/tags
  let tags: string[] = [];
  if (user.etiqueta && Array.isArray(user.etiqueta)) {
    tags = user.etiqueta.filter((tag: any) => typeof tag === 'string' && tag.length > 0);
  }
  
  const feedCard: FeedCard = {
    id: String(user.id_usuario || user.id),
    name: user.nombre_usuario || user.nombre || "Usuario",
    age: user.edad || 0,
    therianType: user.tipo_therian || "no_therian",
    bio: user.descripcion || user.bio || "Sin descripción",
    photos: photoUrls,
    tags: tags,
    provincia: user.provincia || "No especificada",
    descriptionSections: [
      { 
        title: "Sobre mi", 
        content: user.descripcion || user.bio || "Sin información" 
      },
      { 
        title: "Tipo Therian", 
        content: user.tipo_therian || "No especificado" 
      },
      { 
        title: "Ubicación", 
        content: user.provincia || "Ubicación no disponible" 
      },
    ],
  };
  
  console.log("✅ FeedCard transformada:", {
    id: feedCard.id,
    name: feedCard.name,
    age: feedCard.age,
    therianType: feedCard.therianType,
    photosCount: feedCard.photos.length,
    tagsCount: tags.length
  });
  
  return feedCard;
}

const Feed = () => {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // --- Redux cache ---
  const cachedCards = useAppSelector((state) => state.feed.cards);
  const cachedIndex = useAppSelector((state) => state.feed.currentIndex);
  const cachedFilterOptions = useAppSelector((state) => state.feed.filterOptions);
  const cardsLoaded = useAppSelector((state) => state.feed.cardsLoaded);
  const filterOptionsLoaded = useAppSelector((state) => state.feed.filterOptionsLoaded);
  const isRefreshing = useAppSelector((state) => state.feed.isRefreshing);
  const feedError = useAppSelector((state) => state.feed.error);

  // Local UI state (NOT cached — resets per visit)
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lastAction, setLastAction] = useState<{ index: number; action: SwipeAction } | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingUserId, setReportingUserId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState<"BIOGRAFIA" | "NOMBRE" | "IMAGEN" | "">("");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [denunciaData, setDenunciaData] = useState<{motivo: Array<{id_motivo_denuncia: number; nombre_motivo: string}>; tipo: Array<{id_tipo_denuncia: number; nombre_tipo_denuncia: string}>} | null>(null);
  const [selectedTipoDenuncia, setSelectedTipoDenuncia] = useState<number | "">();
  const [selectedMotivoDenuncia, setSelectedMotivoDenuncia] = useState<number | "">();
  const [notificacion, setNotificacion] = useState<{tipo: "exito" | "error"; mensaje: string} | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    edadMin: 16,
    edadMax: 80,
    provincia: "",
    tipo_persona: "",
    genero: ""
  });

  // Derived: use cached filter options or empty defaults
  const filterOptions = cachedFilterOptions || {
    provincias: [] as Array<{id_provincia: number; nombre_provincia: string}>,
    tipos_persona: [] as Array<{id_tipo_persona: number; nombre_tipo_persona: string}>,
    generos: [] as Array<{id_genero: number; nombre_genero: string}>
  };
  const loadingFilterOptions = !filterOptionsLoaded;

  // Loading: only show spinner if no cached data
  const loading = !cardsLoaded && isRefreshing;
  const error = feedError;
  const cards = cachedCards;
  const currentIndex = cachedIndex;

  // Swipe card state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeStartX = useRef(0);
  const isSwiping = useRef(false);

  // Photo swipe state
  const photoTouchStartY = useRef(0);
  const isPhotoSwipe = useRef(false);

  // Cargar opciones de filtros (usa cache)
  useEffect(() => {
    if (filterOptionsLoaded) return;
    const loadFilterOptions = async () => {
      try {
        const options = await FeedService.getFilterOptions();
        const mappedOptions = {
          provincias: Array.isArray(options.provincias) ? options.provincias : [],
          tipos_persona: Array.isArray(options.tipos_persona) ? options.tipos_persona : [],
          generos: Array.isArray(options.generos) ? options.generos : []
        };
        dispatch(setReduxFilterOptions(mappedOptions));
      } catch (error) {
        console.error("Error cargando filter options:", error);
      }
    };
    loadFilterOptions();
  }, [filterOptionsLoaded, dispatch]);

  // Función para recargar feed con filtros actuales
  const loadFeedWithFilters = async (userId: number) => {
    try {
      dispatch(setRefreshing(true));
      dispatch(setFeedError(null));

      const hasActiveFilters = 
        filters.provincia !== "" || 
        filters.tipo_persona !== "" || 
        filters.genero !== "" ||
        filters.edadMin !== 16 ||
        filters.edadMax !== 80;

      let response;
      if (hasActiveFilters) {
        response = await FeedService.getFeedFiltered(
          userId,
          filters.provincia ? parseInt(filters.provincia) : undefined,
          filters.tipo_persona ? parseInt(filters.tipo_persona) : undefined,
          filters.genero ? parseInt(filters.genero) : undefined,
          filters.edadMin,
          filters.edadMax
        );
      } else {
        response = await FeedService.getFeed(userId);
      }

      const feedCards = (response.users || []).map(transformBackendUserToFeedCard);
      dispatch(setFeedCards(feedCards));
    } catch (err: any) {
      console.error("Error cargando feed:", err);
      dispatch(setFeedError(err.message || "Error al cargar el feed"));
    }
  };

  // Cargar usuarios del feed (usa cache: si ya hay cards, refresca en background)
  useEffect(() => {
    let userId: number | null = null;
    if (auth.userId) userId = auth.userId;

    if (!userId) {
      if (!cardsLoaded) dispatch(setFeedError("Usuario no autenticado"));
      return;
    }

    if (auth.userId || auth.googleId || auth.tokens) {
      loadFeedWithFilters(userId);
    }
  }, [auth.userId, auth.googleId, auth.tokens]);

  const currentCard = cards[currentIndex];

  const handleAction = (action: SwipeAction) => {
    if (!currentCard) return;

    // Obtener el userId del usuario autenticado
    let userId: number | null = null;
    if (auth.userId) {
      userId = auth.userId;
    } else if (auth.googleId) {
      userId = parseInt(auth.googleId);
    }

    if (!userId) {
      console.error("❌ No hay userId disponible para hacer like/dislike");
      return;
    }

    if (action === "undo") {
      if (lastAction && currentIndex > 0) {
        dispatch(setFeedIndex(currentIndex - 1));
        setPhotoIndex(0);
        setShowFullDescription(false);
        setLastAction(null);
      }
      return;
    }

    if (action === "report") {
      if (currentCard) {
        setReportingUserId(parseInt(currentCard.id));
        // Cargar datos de denuncia si no están cargados
        if (!denunciaData) {
          DenunciaService.obtenerDatos().then(data => {
            setDenunciaData(data);
          }).catch(err => console.error("❌ Error al cargar datos de denuncia:", err));
        }
        setShowReportModal(true);
      }
      return;
    }

    sendSwipeAction({ targetUserId: currentCard.id, action }, userId);
    setLastAction({ index: currentIndex, action });
    dispatch(setFeedIndex(currentIndex + 1));
    setPhotoIndex(0);
    setShowFullDescription(false);
    setSwipeOffset(0);
  };

  const handleReport = async () => {
    if (!reportingUserId || !selectedTipoDenuncia || !selectedMotivoDenuncia) {
      console.error("❌ Faltan datos para la denuncia");
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar si es tipo FOTO y que hay imagen seleccionada
    const tipoSeleccionado = denunciaData?.tipo?.find(t => t.id_tipo_denuncia === selectedTipoDenuncia);
    const isFotoType = tipoSeleccionado?.nombre_tipo_denuncia.toUpperCase().includes("FOTO");
    
    if (isFotoType && selectedImage === null) {
      alert("Por favor selecciona una imagen");
      return;
    }

    setSubmittingReport(true);
    try {
      console.log("📤 Enviando denuncia...", {
        id_denunciado: reportingUserId,
        id_tipo_denuncia: selectedTipoDenuncia,
        id_motivo_denuncia: selectedMotivoDenuncia,
        tipo_contenido: isFotoType ? "IMAGEN" : "BIOGRAFIA",
        id_imagen: selectedImage,
        descripcion: reportDescription,
      });

      const payload = {
        id_denunciado: reportingUserId,
        id_tipo_denuncia: Number(selectedTipoDenuncia),
        id_motivo_denuncia: Number(selectedMotivoDenuncia),
        tipo_contenido: isFotoType ? ("IMAGEN" as const) : ("BIOGRAFIA" as const),
        id_imagen: isFotoType && selectedImage !== null ? selectedImage : undefined,
        descripcion: reportDescription || undefined,
      };

      await DenunciaService.denunciarUsuario(payload);

      console.log("✅ Denuncia enviada exitosamente");

      // Cerrar modal y resetear estado
      setShowReportModal(false);
      setReportReason("");
      setSelectedImage(null);
      setReportDescription("");
      setReportingUserId(null);
      setSelectedTipoDenuncia("");
      setSelectedMotivoDenuncia("");

      // Hacer dislike automático (pasar a siguiente carta)
      setLastAction({ index: currentIndex, action: "dislike" });
      dispatch(setFeedIndex(currentIndex + 1));
      setPhotoIndex(0);
      setShowFullDescription(false);
      setSwipeOffset(0);

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

  // Card swipe handlers
  const handleCardTouchStart = (e: TouchEvent) => {
    swipeStartX.current = e.targetTouches[0].clientX;
    photoTouchStartY.current = e.targetTouches[0].clientY;
    isSwiping.current = false;
    isPhotoSwipe.current = false;
  };

  const handleCardTouchMove = (e: TouchEvent) => {
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = currentX - swipeStartX.current;
    const diffY = Math.abs(currentY - photoTouchStartY.current);

    if (!isSwiping.current && !isPhotoSwipe.current) {
      if (Math.abs(diffX) > 15 && Math.abs(diffX) > diffY) {
        isSwiping.current = true;
      } else if (diffY > 15) {
        return;
      }
    }

    if (isSwiping.current) {
      setSwipeOffset(diffX);
    }
  };

  const handleCardTouchEnd = () => {
    if (!currentCard) return;

    if (isSwiping.current) {
      const threshold = 120;
      if (swipeOffset < -threshold) {
        handleAction("like");
      } else if (swipeOffset > threshold) {
        handleAction("dislike");
      }
      setSwipeOffset(0);
      isSwiping.current = false;
      return;
    }

    isSwiping.current = false;
    isPhotoSwipe.current = false;
  };

  const handlePhotoTap = (e: React.MouseEvent) => {
    if (!currentCard || isSwiping.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3 && photoIndex > 0) {
      setPhotoIndex((prev) => prev - 1);
    } else if (x > width * 0.7 && photoIndex < currentCard.photos.length - 1) {
      setPhotoIndex((prev) => prev + 1);
    }
  };

  const currentSection = currentCard?.descriptionSections[photoIndex];

  const likeGlow = swipeOffset < -40;
  const dislikeGlow = swipeOffset > 40;

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ touchAction: 'manipulation', overscrollBehaviorX: 'none' }}>
      {/* Top bar */}
      <div className="gradient-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoColor} alt="PawTalk" className="h-10 w-10" />
          <span className="text-2xl font-extrabold text-primary-foreground italic">PawTalk</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors"
          >
            <SlidersHorizontal className="h-6 w-6" />
          </button>
          <button className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-destructive mb-4">❌ {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (cards.length === 0 || !currentCard) && (
          <div className="text-center py-32">
            <p className="text-muted-foreground mb-6">Parece que no hay usuarios por ahora 🐾</p>
            <button
              onClick={() => {
                const userId = auth.userId || (auth.googleId ? parseInt(auth.googleId) : null);
                if (userId) {
                  loadFeedWithFilters(userId);
                }
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && currentCard ? (
          <>
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-card relative transition-transform duration-100"
            style={{
              transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg) scale(${1 - Math.abs(swipeOffset) * 0.001})`,
              touchAction: 'none',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onTouchStart={handleCardTouchStart}
            onTouchMove={handleCardTouchMove}
            onTouchEnd={handleCardTouchEnd}
          >
            {/* Photo */}
            <div className="relative aspect-[3/4] w-full" onClick={handlePhotoTap}>
              <img
                src={currentCard.photos[photoIndex] || currentCard.photos[0]}
                alt={currentCard.name}
                className="w-full h-full object-cover pointer-events-none select-none"
              />

              {/* Swipe overlays */}
              {likeGlow && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                  <span className="text-6xl font-extrabold text-primary rotate-[-15deg] border-4 border-primary rounded-2xl px-6 py-2">LIKE</span>
                </div>
              )}
              {dislikeGlow && (
                <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center pointer-events-none">
                  <span className="text-6xl font-extrabold text-destructive rotate-[15deg] border-4 border-destructive rounded-2xl px-6 py-2">NOPE</span>
                </div>
              )}

              {/* Photo indicators */}
              <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
                {currentCard.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i === photoIndex ? "bg-primary-foreground" : "bg-primary-foreground/40"
                    }`}
                  />
                ))}
              </div>

              {/* Report button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleAction("report"); }}
                className="absolute top-8 right-4 h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform"
              >
                <img src={reportarIcon} alt="Reportar" className="h-10 w-10" />
              </button>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 pt-20">
                <h2 className="text-2xl font-extrabold text-white">
                  {currentCard.name}, {currentCard.age}{" "}
                  <span>{THERIAN_EMOJIS[currentCard.therianType] || "🐾"}</span>
                </h2>

                {/* Provincia */}
                <p className="text-white/70 text-xs flex items-center gap-1 mt-2">
                  <MapPin className="h-3.5 w-3.5" /> {currentCard.provincia}
                </p>

                {/* Tags */}
                {currentCard.tags && currentCard.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {currentCard.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-primary/30 text-white/90 text-xs font-semibold border border-primary/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {currentSection && (
                  <div className="mt-3">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider">
                      {currentSection.title}
                    </p>
                    <p className="text-white/90 text-sm leading-relaxed mt-1 line-clamp-2">
                      {currentSection.content}
                    </p>
                  </div>
                )}

                {/* Pull-up handle */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFullDescription(true); }}
                  className="mt-3 w-full flex justify-center"
                >
                  <div className="w-10 h-1.5 rounded-full bg-white/50" />
                </button>
              </div>
            </div>
          </div>

          {/* Full description overlay */}
          {showFullDescription && currentCard && (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-slide-up">
              <button
                onClick={() => setShowFullDescription(false)}
                className="w-full flex justify-center pt-4 pb-2"
              >
                <div className="w-10 h-1.5 rounded-full bg-muted-foreground/40" />
              </button>

              <div className="flex-1 overflow-y-auto px-5 pb-8">
                <div className="flex items-end gap-4 mb-6">
                  <img
                    src={currentCard.photos[0]}
                    alt={currentCard.name}
                    className="h-24 w-24 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-foreground">
                      {currentCard.name}, {currentCard.age}{" "}
                      <span>{THERIAN_EMOJIS[currentCard.therianType] || "🐾"}</span>
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" /> {currentCard.provincia}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {currentCard.tags && currentCard.tags.length > 0 && (
                  <div className="bg-secondary/50 rounded-2xl px-5 py-4 mb-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-primary mb-3">
                      Intereses
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentCard.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-primary/20 text-foreground text-xs font-semibold border border-primary/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {currentCard.descriptionSections.map((section, i) => (
                    <div key={i} className="bg-secondary/50 rounded-2xl px-5 py-4">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-primary mb-2">
                        {section.title}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-4 flex items-center justify-center gap-6 border-t border-border">
                <button
                  onClick={() => { setShowFullDescription(false); handleAction("dislike"); }}
                  className="h-14 w-14 rounded-full border-2 border-destructive flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                >
                  <X className="h-7 w-7" strokeWidth={3} />
                </button>
                <button
                  onClick={() => { setShowFullDescription(false); handleAction("like"); }}
                  className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-soft hover:bg-primary-hover transition-all active:scale-90"
                >
                  <ThumbsUp className="h-7 w-7" />
                </button>
              </div>
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-20">
          </div>
        )}

        {/* Action buttons */}
        {currentCard && (
          <div className="flex items-center justify-center gap-6 mt-5 mb-4">
            <button
              onClick={() => handleAction("undo")}
              disabled={currentIndex === 0}
              className="h-14 w-14 rounded-full border-2 border-accent text-accent-foreground flex items-center justify-center hover:bg-accent/10 disabled:opacity-30 transition-all active:scale-90"
            >
              <Undo2 className="h-7 w-7" />
            </button>
            <button
              onClick={() => handleAction("dislike")}
              className={`h-16 w-16 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                dislikeGlow
                  ? "border-destructive bg-destructive text-white shadow-lg scale-110"
                  : "border-destructive text-destructive hover:bg-destructive/10"
              }`}
            >
              <X className="h-8 w-8" strokeWidth={3} />
            </button>
            <button
              onClick={() => handleAction("like")}
              className={`h-16 w-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                likeGlow
                  ? "bg-primary text-primary-foreground shadow-lg scale-110 ring-4 ring-primary/30"
                  : "bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover"
              }`}
            >
              <ThumbsUp className="h-8 w-8" />
            </button>
          </div>
        )}
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={() => setShowFilters(false)}
        >
          <div 
            className="w-full bg-background rounded-t-3xl p-6 animate-slide-up flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-foreground">Filtros</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-6">
              <div className="space-y-6">
              {loadingFilterOptions && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p>Cargando opciones de filtros...</p>
                </div>
              )}
              {/* Age Range */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
                  Rango de edad: {filters.edadMin} - {filters.edadMax}
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Edad mínima</label>
                    <input
                      type="range"
                      min="16"
                      max="80"
                      value={filters.edadMin}
                      onChange={(e) => setFilters({
                        ...filters,
                        edadMin: Math.min(parseInt(e.target.value), filters.edadMax)
                      })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Edad máxima</label>
                    <input
                      type="range"
                      min="16"
                      max="80"
                      value={filters.edadMax}
                      onChange={(e) => setFilters({
                        ...filters,
                        edadMax: Math.max(parseInt(e.target.value), filters.edadMin)
                      })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Provincia */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
                  Provincia
                </label>
                <select
                  value={filters.provincia}
                  onChange={(e) => setFilters({ ...filters, provincia: e.target.value })}
                  disabled={loadingFilterOptions || filterOptions.provincias.length === 0}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-secondary-foreground/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{loadingFilterOptions ? "Cargando..." : "Todas las provincias"}</option>
                  {filterOptions.provincias.map((prov) => (
                    <option key={prov.id_provincia} value={String(prov.id_provincia)}>{prov.nombre_provincia}</option>
                  ))}
                </select>
              </div>

              {/* Tipo Persona */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
                  Tipo Persona
                </label>
                <select
                  value={filters.tipo_persona}
                  onChange={(e) => setFilters({ ...filters, tipo_persona: e.target.value })}
                  disabled={loadingFilterOptions || filterOptions.tipos_persona.length === 0}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-secondary-foreground/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{loadingFilterOptions ? "Cargando..." : "Todos los tipos"}</option>
                  {filterOptions.tipos_persona.map((tipo) => (
                    <option key={tipo.id_tipo_persona} value={String(tipo.id_tipo_persona)}>{tipo.nombre_tipo_persona}</option>
                  ))}
                </select>
              </div>

              {/* Genero */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
                  Género
                </label>
                <select
                  value={filters.genero}
                  onChange={(e) => setFilters({ ...filters, genero: e.target.value })}
                  disabled={loadingFilterOptions || filterOptions.generos.length === 0}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-secondary-foreground/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{loadingFilterOptions ? "Cargando..." : "Todos los géneros"}</option>
                  {filterOptions.generos.map((genero) => (
                    <option key={genero.id_genero} value={String(genero.id_genero)}>{genero.nombre_genero}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-3 flex gap-3">
                <button
                  onClick={() => {
                    setFilters({
                      edadMin: 16,
                      edadMax: 80,
                      provincia: "",
                      tipo_persona: "",
                      genero: ""
                    });
                  }}
                  className="flex-1 px-4 py-3 border-2 border-secondary-foreground/30 rounded-lg text-foreground font-bold hover:bg-secondary/50 transition-colors"
                >
                  Resetear
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false);
                    // Recargar feed con los filtros aplicados
                    const userId = auth.userId || (auth.googleId ? parseInt(auth.googleId) : null);
                    if (userId) {
                      loadFeedWithFilters(userId);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-primary rounded-lg text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && currentCard && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !submittingReport && setShowReportModal(false)}
        >
          <div 
            className="bg-background rounded-3xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-foreground">Denunciar</h2>
              <button
                onClick={() => !submittingReport && setShowReportModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Tipo de Denuncia - Solo PERFIL en Feed */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider">
                  Tipo de denuncia
                </label>
                <select
                  value={selectedTipoDenuncia}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : "";
                    setSelectedTipoDenuncia(value);
                    // Auto-detect si es FOTO y establecer reportReason
                    if (value) {
                      const tipoSeleccionado = denunciaData?.tipo?.find(t => t.id_tipo_denuncia === value);
                      if (tipoSeleccionado?.nombre_tipo_denuncia.toUpperCase().includes("FOTO")) {
                        setReportReason("IMAGEN");
                      } else {
                        setReportReason("");
                      }
                    } else {
                      setReportReason("");
                    }
                    setSelectedImage(null);
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-secondary-foreground/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecciona tipo de denuncia...</option>
                  {denunciaData?.tipo
                    ?.filter(tipo => !tipo.nombre_tipo_denuncia.toUpperCase().includes("MENSAJE"))
                    .map((tipo) => (
                      <option key={tipo.id_tipo_denuncia} value={tipo.id_tipo_denuncia}>
                        {tipo.nombre_tipo_denuncia}
                      </option>
                    ))}
                </select>
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

              {/* Seleccionar Imagen si es tipo FOTO */}
              {reportReason === "IMAGEN" && currentCard.photos && currentCard.photos.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
                    Selecciona la/las imagen(es) a denunciar
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {currentCard.photos.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === idx
                            ? "border-primary ring-2 ring-primary"
                            : "border-secondary-foreground/30 hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        {selectedImage === idx && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <span className="text-white font-bold">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {currentCard.photos.length} imagen(es) disponible(s)
                  </p>
                </div>
              )}

              {/* Descripción */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider">
                  Descripción (opcional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Cuéntanos más sobre por qué denuncias a esta persona..."
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-secondary-foreground/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={4}
                  disabled={submittingReport}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {reportDescription.length}/500
                </p>
              </div>

              {/* Botones */}
              <div className="pt-4 space-y-2 flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  disabled={submittingReport}
                  className="flex-1 px-4 py-3 border-2 border-secondary-foreground/30 rounded-lg text-foreground font-bold hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReport}
                  disabled={
                    !selectedTipoDenuncia || 
                    !selectedMotivoDenuncia || 
                    (reportReason === "IMAGEN" && selectedImage === null) ||
                    submittingReport
                  }
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

      {/* Notificación de Denuncia */}
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

      <BottomNav />
    </div>
  );
};

export default Feed;
