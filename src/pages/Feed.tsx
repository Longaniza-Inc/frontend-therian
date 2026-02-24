import { useState, useRef, TouchEvent, useEffect } from "react";
import { Undo2, X, ThumbsUp, SlidersHorizontal, Bell, MapPin } from "lucide-react";
import logoColor from "@/assets/logo-color.png";
import reportarIcon from "@/assets/reportar.png";
import BottomNav from "@/components/BottomNav";
import { useAppSelector } from "@/hooks/useAppDispatch";
import FeedService from "@/services/feedService";
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

async function sendSwipeAction(_payload: SwipePayload): Promise<void> {
  console.log("Swipe action:", _payload);
}

/**
 * Transformar datos del backend a FeedCard
 */
function transformBackendUserToFeedCard(user: any): FeedCard {
  return {
    id: String(user.id_usuario || user.id),
    name: user.nombre_usuario || user.nombre || "Usuario",
    age: user.edad || 0,
    therianType: user.tipo_therian || "no_therian",
    bio: user.descripcion || user.bio || "Sin descripción",
    photos: user.imagenes?.length > 0 
      ? user.imagenes 
      : ["https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=600&h=800&fit=crop"],
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
}

const Feed = () => {
  const auth = useAppSelector((state) => state.auth);
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lastAction, setLastAction] = useState<{ index: number; action: SwipeAction } | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Swipe card state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeStartX = useRef(0);
  const isSwiping = useRef(false);

  // Photo swipe state
  const photoTouchStartY = useRef(0);
  const isPhotoSwipe = useRef(false);

  // Cargar usuarios del feed
  useEffect(() => {
    const loadFeed = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usar el email o id de Google como id del usuario
        const userId = parseInt(auth.googleId || "1");
        console.log("📡 Cargando feed para usuario:", userId);

        // Obtener usuarios recomendados sin filtros por el momento
        const response = await FeedService.getFeed(userId);
        
        // Transformar datos del backend a FeedCard
        const feedCards = (response.users || []).map(transformBackendUserToFeedCard);
        console.log("✅ Feed cargado con", feedCards.length, "usuarios");
        
        setCards(feedCards);
      } catch (err: any) {
        console.error("❌ Error al cargar el feed:", err);
        setError(err.message || "Error al cargar el feed");
        // Mantener los mock cards como fallback
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    if (auth.googleId) {
      loadFeed();
    }
  }, [auth.googleId]);

  const currentCard = cards[currentIndex];

  const handleAction = (action: SwipeAction) => {
    if (!currentCard) return;

    if (action === "undo") {
      if (lastAction && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
        setPhotoIndex(0);
        setShowFullDescription(false);
        setLastAction(null);
      }
      return;
    }

    if (action === "report") {
      sendSwipeAction({ targetUserId: currentCard.id, action: "report" });
      return;
    }

    sendSwipeAction({ targetUserId: currentCard.id, action });
    setLastAction({ index: currentIndex, action });
    setCurrentIndex((prev) => prev + 1);
    setPhotoIndex(0);
    setShowFullDescription(false);
    setSwipeOffset(0);
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="gradient-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoColor} alt="thalk" className="h-10 w-10" />
          <span className="text-2xl font-extrabold text-primary-foreground italic">thalk</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">
            <SlidersHorizontal className="h-6 w-6" />
          </button>
          <button className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
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

        {!loading && !error && cards.length === 0 && (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No hay usuarios disponibles en este momento</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Recargar
            </button>
          </div>
        )}

        {!loading && currentCard ? (
          <>
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-card bg-card relative transition-transform duration-100"
            style={{
              transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)`,
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
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-20">
                <h2 className="text-2xl font-extrabold text-white">
                  {currentCard.name}, {currentCard.age}{" "}
                  <span>{THERIAN_EMOJIS[currentCard.therianType] || "🐾"}</span>
                </h2>

                {currentSection && (
                  <div className="mt-2">
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
                  <div>
                    <h2 className="text-2xl font-extrabold text-foreground">
                      {currentCard.name}, {currentCard.age}{" "}
                      <span>{THERIAN_EMOJIS[currentCard.therianType] || "🐾"}</span>
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" /> Argentina
                    </p>
                  </div>
                </div>

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
            <p className="text-2xl">🐾</p>
            <p className="text-muted-foreground mt-2 font-semibold">No hay más perfiles por ahora</p>
            <p className="text-muted-foreground text-sm mt-1">Vuelve más tarde</p>
          </div>
        )}

        {/* Action buttons */}
        {currentCard && (
          <div className="flex items-center justify-center gap-6 mt-5">
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

      <BottomNav />
    </div>
  );
};

export default Feed;
