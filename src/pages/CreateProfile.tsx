import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Camera, Plus, ChevronLeft, ChevronDown, User, Phone, MapPin, Calendar, AtSign, FileText, Heart, Sparkles, ImageIcon, X, GripVertical } from "lucide-react";
import logo from "@/assets/logo-therian.png";
import { THERIAN_TYPES, type TherianType } from "@/types";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import type { RootState } from "@/store";

const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1500534314263-d6c09705e82e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1425082661507-d6d2cceb8893?w=200&h=200&fit=crop",
];

const TOTAL_STEPS = 9;

/**
 * Calcular edad a partir de fecha de nacimiento
 */
const calculateAge = (birthdate: string): number => {
  if (!birthdate) return 0;
  const birth = new Date(birthdate);
  const today = new Date();
  return today.getFullYear() - birth.getFullYear() - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
};

const STEP_INFO: { emoji: string; title: string; subtitle: string }[] = [
  { emoji: "👋", title: "¿Cómo te llamas?", subtitle: "Cuéntanos tu nombre y elige un username único para la manada" },
  { emoji: "🎂", title: "¿Cuándo naciste?", subtitle: "Necesitamos saber tu fecha de nacimiento para verificar tu edad" },
  { emoji: "📱", title: "Tu teléfono", subtitle: "Opcional, pero útil para que tus amigos te encuentren" },
  { emoji: "📸", title: "Tus mejores fotos", subtitle: "Sube tu foto de perfil y algunas fotos más para que te conozcan" },
  { emoji: "📍", title: "¿De dónde eres?", subtitle: "Selecciona tu provincia para encontrar therians cerca de ti" },
  { emoji: "🐾", title: "¿Qué tipo eres?", subtitle: "Elige el tipo que más te represente, ¡no hay respuesta incorrecta!" },
  { emoji: "🧑", title: "Tu género", subtitle: "Selecciona tu género" },
  { emoji: "✨", title: "Sobre ti", subtitle: "Escribe una breve bio para que la manada te conozca mejor" },
  { emoji: "💚", title: "Tus intereses", subtitle: "Elige lo que te apasiona para conectar con personas similares" },
];

const CreateProfile = () => {
  const navigate = useNavigate();
  const { registerUser, loading } = useAuth();
  const { email: googleEmail, googleId } = useSelector((state: RootState) => state.auth);
  const [step, setStep] = useState(0);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const additionalPhotoInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<number>(0);
  const [dragCurrent, setDragCurrent] = useState<number>(0);

  // Form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [phone, setPhone] = useState("");
  const [showProvinces, setShowProvinces] = useState(false);
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [additionalPhotoFiles, setAdditionalPhotoFiles] = useState<File[]>([]);
  const [additionalPhotosPreviews, setAdditionalPhotosPreviews] = useState<string[]>([]);
  const [showDefaultAvatars, setShowDefaultAvatars] = useState(false);
  const [etiquetas, setEtiquetas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loadingEtiquetas, setLoadingEtiquetas] = useState(true);
  const [generos, setGeneros] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loadingGeneros, setLoadingGeneros] = useState(true);
  const [generoSeleccionado, setGeneroSeleccionado] = useState<number | null>(null);
  const [provincias, setProvincias] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loadingProvincias, setLoadingProvincias] = useState(true);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<number | null>(null);
  const [tipoPersonas, setTipoPersonas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loadingTipoPersonas, setLoadingTipoPersonas] = useState(true);
  const [tipoPersonaSeleccionado, setTipoPersonaSeleccionado] = useState<number | null>(null);

  // Load etiquetas from backend
  useEffect(() => {
    const cargarEtiquetas = async () => {
      try {
        const response = await authService.getEtiquetas();
        console.log("📥 Respuesta completa del backend:", response);
        
        // Handle both formats: {etiquetas: [...]} or direct array [...]
        const etiquetasArray = response.etiquetas || response;
        if (Array.isArray(etiquetasArray)) {
          setEtiquetas(etiquetasArray);
          console.log("✅ Etiquetas cargadas:", etiquetasArray);
        } else {
          console.warn("⚠️ Respuesta no es un array ni tiene propiedad etiquetas:", response);
          setEtiquetas([]);
        }
      } catch (error) {
        console.error("❌ Error loading etiquetas:", error);
        setEtiquetas([]);
      } finally {
        setLoadingEtiquetas(false);
      }
    };

    cargarEtiquetas();
  }, []);

  // Load géneros from backend
  useEffect(() => {
    const cargarGeneros = async () => {
      try {
        const response = await authService.getGeneros();
        console.log("📥 Respuesta completa de géneros:", response);
        
        // Handle both formats: {generos: [...]} or direct array [...]
        const generosArray = response.generos || response;
        if (Array.isArray(generosArray)) {
          setGeneros(generosArray);
          console.log("✅ Géneros cargados:", generosArray);
        } else {
          console.warn("⚠️ Respuesta de géneros no es un array:", response);
          setGeneros([]);
        }
      } catch (error) {
        console.error("❌ Error loading géneros:", error);
        setGeneros([]);
      } finally {
        setLoadingGeneros(false);
      }
    };

    cargarGeneros();
  }, []);

  // Load provincias from backend
  useEffect(() => {
    const cargarProvincias = async () => {
      try {
        const response = await authService.getProvincias();
        console.log("📥 Respuesta completa de provincias:", response);
        
        // Handle both formats: {provincias: [...]} or direct array [...]
        const provinciasArray = response.provincias || response;
        if (Array.isArray(provinciasArray)) {
          setProvincias(provinciasArray);
          console.log("✅ Provincias cargadas:", provinciasArray);
        } else {
          console.warn("⚠️ Respuesta de provincias no es un array:", response);
          setProvincias([]);
        }
      } catch (error) {
        console.error("❌ Error loading provincias:", error);
        setProvincias([]);
      } finally {
        setLoadingProvincias(false);
      }
    };

    cargarProvincias();
  }, []);

  // Load tipo personas from backend
  useEffect(() => {
    const cargarTipoPersonas = async () => {
      try {
        const response = await authService.getTipoPersonas();
        console.log("📥 Respuesta completa de tipos de personas:", response);
        
        // Handle both formats: {tipoPersonas: [...]} or direct array [...]
        const tipoPersonasArray = response.tipoPersonas || response;
        if (Array.isArray(tipoPersonasArray)) {
          setTipoPersonas(tipoPersonasArray);
          console.log("✅ Tipos de personas cargados:", tipoPersonasArray);
        } else {
          console.warn("⚠️ Respuesta de tipos de personas no es un array:", response);
          setTipoPersonas([]);
        }
      } catch (error) {
        console.error("❌ Error loading tipos de personas:", error);
        setTipoPersonas([]);
      } finally {
        setLoadingTipoPersonas(false);
      }
    };

    cargarTipoPersonas();
  }, []);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const info = STEP_INFO[step];

  const canGoNext = (): boolean => {
    switch (step) {
      case 0: return name.trim().length > 0 && username.trim().length > 0;
      case 1: return birthdate.length > 0;
      case 2: return true; // phone is optional
      case 3: return profilePhotoPreview.length > 0; // profile photo required
      case 4: return provinciaSeleccionada !== null; // provincia required
      case 5: return tipoPersonaSeleccionado !== null; // tipo personas required
      case 6: return generoSeleccionado !== null; // género required
      case 7: return bio.trim().length >= 10; // ✅ Bio mínimo 10 caracteres
      case 8: return selectedInterests.length > 0; // ✅ Al menos 1 etiqueta
      default: return false;
    }
  };

  const handleNext = async () => {
    // ✅ VALIDACIÓN DE EDAD en Step 1 (Birthdate)
    if (step === 1) {
      const age = calculateAge(birthdate);
      if (age < 18) {
        alert("❌ Debes tener al menos 18 años para registrarte");
        return;
      }
    }

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      // ✅ VALIDACIONES REQUERIDAS antes de registrar
      if (!bio || bio.trim().length < 10) {
        alert("La descripción 'Sobre ti' debe tener al menos 10 caracteres");
        return;
      }

      if (selectedInterests.length === 0) {
        alert("Debes seleccionar al menos 1 etiqueta de intereses");
        return;
      }

      // Finish — submit profile
      try {
        // Get etiqueta IDs from selected names
        const etiquetaIds = selectedInterests.map(nombre => 
          etiquetas.find(e => e.nombre === nombre)?.id
        ).filter(Boolean) as number[];

        // Create user data as JSON
        const userData = JSON.stringify({
          nombre: name,
          user_name: username,
          email: googleEmail, // From Google auth callback stored in Redux
          pwd: "", // Will come from Google auth
          bio: bio,
          FechaNacimiento: birthdate,
          FechaCreacion: new Date().toISOString(),
          tipoPersona_id: tipoPersonaSeleccionado, // Dynamic tipo personas from backend
          provincia_id: provinciaSeleccionada, // ID de provincia
          genero_id: generoSeleccionado, // Dynamic género from backend
          google_id: googleId, // From Google auth callback stored in Redux
          imagenes: [],
          etiquetas: etiquetaIds,
        });

        console.log("📤 JSON enviado al backend:", JSON.parse(userData));
        console.log("📷 Fotos enviadas:", additionalPhotoFiles.length > 0 ? additionalPhotoFiles.map(f => f.name) : "Sin fotos adicionales");

        // Collect all images: profile photo first, then additional photos
        const allImages: File[] = [];
        if (profilePhotoFile) {
          allImages.push(profilePhotoFile);
        }
        allImages.push(...additionalPhotoFiles);

        // Call register
        await registerUser(userData, allImages);
        
        navigate("/feed");
      } catch (error) {
        console.error("Error registering user:", error);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // Photo handlers
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const preview = URL.createObjectURL(file);
      setProfilePhotoPreview(preview);
    }
  };

  const handleAdditionalPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && additionalPhotoFiles.length < 6) {
      setAdditionalPhotoFiles([...additionalPhotoFiles, file]);
      const preview = URL.createObjectURL(file);
      setAdditionalPhotosPreviews([...additionalPhotosPreviews, preview]);
    }
  };

  const removeAdditionalPhoto = (index: number) => {
    const newFiles = additionalPhotoFiles.filter((_, i) => i !== index);
    const newPreviews = additionalPhotosPreviews.filter((_, i) => i !== index);
    setAdditionalPhotoFiles(newFiles);
    setAdditionalPhotosPreviews(newPreviews);
  };

  const movePhoto = (index: number, direction: "up" | "down") => {
    const newFiles = [...additionalPhotoFiles];
    const newPreviews = [...additionalPhotosPreviews];
    if (direction === "up" && index > 0) {
      [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
      [newPreviews[index], newPreviews[index - 1]] = [newPreviews[index - 1], newPreviews[index]];
    } else if (direction === "down" && index < newFiles.length - 1) {
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      [newPreviews[index], newPreviews[index + 1]] = [newPreviews[index + 1], newPreviews[index]];
    }
    setAdditionalPhotoFiles(newFiles);
    setAdditionalPhotosPreviews(newPreviews);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
    setDragCurrent(clientX);
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (draggedIndex === null) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setDragCurrent(clientX);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null) return;

    const diff = dragCurrent - dragStart;
    const threshold = 30; // pixels to trigger move

    if (diff > threshold && draggedIndex > 0) {
      // Dragged right → move left in array
      movePhoto(draggedIndex, "up");
    } else if (diff < -threshold && draggedIndex < additionalPhotoFiles.length - 1) {
      // Dragged left → move right in array
      movePhoto(draggedIndex, "down");
    }

    setDraggedIndex(null);
    setDragStart(0);
    setDragCurrent(0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-4">
          {step > 0 && (
            <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="flex-1">
            <Progress value={progress} className="h-2" />
          </div>
          <span className="text-xs text-muted-foreground font-semibold">{step + 1}/{TOTAL_STEPS}</span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-6">
        {/* Step header */}
        <div className="mb-8 text-center">
          <span className="text-4xl mb-3 block">{info.emoji}</span>
          <h2 className="text-2xl font-extrabold text-foreground">{info.title}</h2>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{info.subtitle}</p>
        </div>

        {/* Step body */}
        <div className="flex-1 w-full max-w-sm mx-auto">
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} maxLength={35}
                  className="w-full rounded-2xl border border-input bg-secondary/50 py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={25}
                  className="w-full rounded-2xl border border-input bg-secondary/50 py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <div className="space-y-3">
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="date" 
                    value={birthdate} 
                    onChange={(e) => setBirthdate(e.target.value)}
                    max={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                    min={new Date(new Date().getFullYear() - 100, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                    className="w-full rounded-2xl border border-input bg-secondary/50 py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                </div>
                {birthdate && (() => {
                  const age = calculateAge(birthdate);
                  return (
                    <p className={`text-sm font-semibold ${age < 18 ? 'text-destructive' : 'text-primary'}`}>
                      {age < 18 ? '❌ Debes tener al menos 18 años' : `✅ Tienes ${age} años`}
                    </p>
                  );
                })()}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input type="tel" placeholder="Tu teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={14}
                  className="w-full rounded-2xl border border-input bg-secondary/50 py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              {/* Hidden file inputs */}
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoChange}
                className="hidden"
              />
              <input
                ref={additionalPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleAdditionalPhotoChange}
                className="hidden"
              />

              {/* Main photo */}
              <div className="flex justify-center">
                <button
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="relative h-32 w-32 rounded-full bg-accent border-4 border-primary/30 flex items-center justify-center cursor-pointer hover:border-primary active:scale-95 transition-all overflow-hidden"
                >
                  {profilePhotoPreview ? (
                    <img src={profilePhotoPreview} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-10 w-10 text-primary" />
                  )}
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <Plus className="h-4 w-4 text-primary-foreground" />
                  </div>
                </button>
              </div>
              <p className="text-center text-sm text-muted-foreground font-semibold">Foto principal</p>

              {/* Default avatars toggle */}
              {!profilePhotoPreview && (
                <div className="text-center">
                  <button
                    onClick={() => setShowDefaultAvatars(!showDefaultAvatars)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline transition-colors"
                  >
                    <ImageIcon className="h-4 w-4" />
                    ¿No querés poner una foto? Elegí una de estas
                  </button>
                  {showDefaultAvatars && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {DEFAULT_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setProfilePhotoPreview(url);
                            setProfilePhotoFile(null);
                            setShowDefaultAvatars(false);
                          }}
                          className="rounded-2xl overflow-hidden border-2 border-input hover:border-primary transition-all aspect-square active:scale-95"
                        >
                          <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Additional photos - Carousel */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground">Fotos adicionales ({additionalPhotoFiles.length}/6)</p>
                  {additionalPhotoFiles.length < 6 && (
                    <button
                      onClick={() => additionalPhotoInputRef.current?.click()}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar
                    </button>
                  )}
                </div>

                {additionalPhotoFiles.length > 0 ? (
                  <div
                    ref={carouselRef}
                    className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
                    style={{ scrollBehavior: "smooth" }}
                  >
                    {additionalPhotosPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className={`relative flex-shrink-0 h-24 w-24 rounded-2xl overflow-hidden bg-secondary border border-input group snap-center cursor-grab active:cursor-grabbing transition-transform ${
                          draggedIndex === index ? "scale-110 shadow-lg z-50" : "scale-100"
                        }`}
                        onMouseDown={(e) => handleDragStart(e, index)}
                        onTouchStart={(e) => handleDragStart(e, index)}
                        onMouseMove={handleDragMove}
                        onTouchMove={handleDragMove}
                        onMouseUp={handleDragEnd}
                        onTouchEnd={handleDragEnd}
                        onMouseLeave={draggedIndex === index ? handleDragEnd : undefined}
                      >
                        <img src={preview} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />

                        {/* Overlay with touch hint */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <GripVertical className="h-5 w-5 text-white" />
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => removeAdditionalPhoto(index)}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full transition-colors hover:bg-destructive/80 active:scale-95 shadow-md"
                        >
                          <X className="h-3 w-3" />
                        </button>

                        {/* Index badge */}
                        <div className="absolute bottom-1 left-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                      </div>
                    ))}

                    {/* Add more button */}
                    {additionalPhotoFiles.length < 6 && (
                      <button
                        onClick={() => additionalPhotoInputRef.current?.click()}
                        className="flex-shrink-0 h-24 w-24 rounded-2xl border-2 border-dashed border-input bg-secondary/50 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-accent transition-all active:scale-95"
                      >
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => additionalPhotoInputRef.current?.click()}
                    className="w-full h-24 rounded-2xl border-2 border-dashed border-input bg-secondary/50 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-accent transition-all active:scale-95"
                  >
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </button>
                )}

                <p className="text-xs text-muted-foreground mt-2 text-center">Arrastra las fotos para reordenarlas • Toca la X para eliminar</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in relative">
              {loadingProvincias ? (
                <p className="text-center text-muted-foreground">Cargando provincias...</p>
              ) : provincias.length > 0 ? (
                <>
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
                  <button
                    onClick={() => setShowProvinces(!showProvinces)}
                    className="w-full rounded-2xl border border-input bg-secondary/50 py-4 pl-12 pr-10 text-left text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  >
                    <span className={provinciaSeleccionada ? "text-foreground" : "text-muted-foreground"}>
                      {provincias.find(p => p.id === provinciaSeleccionada)?.nombre || "Selecciona tu provincia"}
                    </span>
                  </button>
                  <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  {showProvinces && (
                    <div className="absolute z-10 mt-2 w-full max-h-48 overflow-y-auto rounded-2xl border border-input bg-background shadow-card">
                      {provincias.map((p) => (
                        <button key={p.id} onClick={() => { setProvinciaSeleccionada(p.id); setShowProvinces(false); }}
                          className={`w-full px-4 py-3 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl ${p.id === provinciaSeleccionada ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>
                          {p.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground">No hay provincias disponibles</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in">
              {loadingTipoPersonas ? (
                <p className="text-center text-muted-foreground">Cargando tipos de personas...</p>
              ) : tipoPersonas.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {tipoPersonas.map((tipo) => {
                    const selected = tipoPersonaSeleccionado === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        onClick={() => setTipoPersonaSeleccionado(tipo.id)}
                        className={`rounded-2xl px-4 py-4 text-sm font-semibold transition-all active:scale-95 flex flex-col items-center gap-2 ${
                          selected ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-foreground border border-input hover:bg-accent"
                        }`}
                      >
                        {tipo.nombre}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No hay tipos de personas disponibles</p>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="animate-fade-in">
              {loadingGeneros ? (
                <p className="text-center text-muted-foreground">Cargando géneros...</p>
              ) : generos.length > 0 ? (
                <div className="space-y-2">
                  {generos.map((genero) => {
                    const selected = generoSeleccionado === genero.id;
                    return (
                      <button
                        key={genero.id}
                        onClick={() => setGeneroSeleccionado(genero.id)}
                        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-95 ${
                          selected ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-foreground border border-input hover:bg-accent"
                        }`}
                      >
                        {genero.nombre}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No hay géneros disponibles</p>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="animate-fade-in">
              <div className="relative">
                <FileText className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <textarea placeholder="Cuéntanos sobre ti..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={225} rows={5}
                  className="w-full rounded-2xl border border-input bg-secondary/50 py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none" />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-right text-xs text-muted-foreground">{bio.length}/225</p>
                {bio.trim().length < 10 && (
                  <p className="text-xs text-destructive font-semibold">⚠️ Mínimo 10 caracteres</p>
                )}
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="animate-fade-in">
              {loadingEtiquetas ? (
                <p className="text-center text-muted-foreground">Cargando intereses...</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {etiquetas.map((etiqueta) => {
                      const selected = selectedInterests.includes(etiqueta.nombre);
                      return (
                        <button key={etiqueta.id} onClick={() => toggleInterest(etiqueta.nombre)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                            selected ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-foreground border border-input hover:bg-accent"
                          }`}>
                          {etiqueta.nombre}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-center">
                    {selectedInterests.length > 0 ? (
                      <p className="text-sm text-primary font-semibold">✅ {selectedInterests.length} seleccionado{selectedInterests.length > 1 ? 's' : ''}</p>
                    ) : (
                      <p className="text-sm text-destructive font-semibold">⚠️ Debes seleccionar al menos 1 interés</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom button */}
        <div className="py-6 w-full max-w-sm mx-auto">
          <button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100"
          >
            {step === TOTAL_STEPS - 1 ? "Finalizar perfil ✨" : step === 2 && !phone.trim() ? "Omitir" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
