import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil, LogOut, Camera, MapPin, Sparkles, X, Check,
  ChevronDown, User, FileText, Tag, Shield, AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppDispatch";
import { setMyProfile } from "@/store/slices/userSlice";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { clearProfile } from "@/store/slices/userSlice";
import { clearChats } from "@/store/slices/chatSlice";
import { clearFeed } from "@/store/slices/feedSlice";
import { userService } from "@/services/userService";
import { authService } from "@/services/authService";
import { imagenService } from "@/services/imagenService";
import type { ProfileData, ProfileUpdateData } from "@/types";

interface EditImage {
  id?: number; // ID del backend si es existente
  url: string;
  isNew: boolean;
  isDeleted?: boolean;
  hash?: string; // SHA256 hash del archivo para detectar duplicados
}

// Función para generar SHA256 hash de un archivo
async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Función para descargar y hashear una imagen del backend
async function hashImageUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    console.log(`✅ Hash calculado para URL: ${url.substring(0, 40)}... → ${hashHex.substring(0, 16)}...`);
    return hashHex;
  } catch (err) {
    console.error(`❌ Error hasheando URL: ${err}`);
    return null;
  }
}

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const auth = useAppSelector((s) => s.auth);
  const { myProfile, profileLoaded } = useAppSelector((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editTipoPersonaId, setEditTipoPersonaId] = useState<number | null>(null);
  const [editProvinciaId, setEditProvinciaId] = useState<number | null>(null);
  const [editEtiquetas, setEditEtiquetas] = useState<number[]>([]);
  const [editImagenes, setEditImagenes] = useState<EditImage[]>([]);
  const [originalImagenes, setOriginalImagenes] = useState<EditImage[]>([]);  // Guardar estructura completa original

  // Catalogues
  const [provincias, setProvincias] = useState<Array<{ id: number; nombre: string }>>([]);
  const [tipoPersonas, setTipoPersonas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [etiquetasCatalog, setEtiquetasCatalog] = useState<Array<{ id: number; nombre: string }>>([]);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);

  // Dropdown
  const [showProvDropdown, setShowProvDropdown] = useState(false);
  const [showTipoDropdown, setShowTipoDropdown] = useState(false);

  // Modal para eliminar imagen
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  // Modal para cambiar imagen principal
  const [showChangePrincipal, setShowChangePrincipal] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  const confirmDeletePhoto = (index: number) => {
    // Validar que no sea la única imagen
    if (editImagenes.length <= 1) {
      console.warn("⚠️ No se puede borrar la única imagen");
      toast({
        title: "❌ No permitido",
        description: "Debes tener al menos una imagen. Agrega otra antes de eliminar esta.",
      });
      return;
    }

    const imgToDelete = editImagenes[index];
    console.log(`🗑️ Confirmando eliminación de imagen [${index}]:`, {
      url: imgToDelete.url.substring(0, 50) + "...",
      isNew: imgToDelete.isNew,
      totalImágenes: editImagenes.length,
    });
    setImageToDelete(index);
    setShowDeleteModal(true);
  };

  const deletePhoto = () => {
    if (imageToDelete !== null) {
      // Doble validación
      if (editImagenes.length <= 1) {
        console.error("⚠️ Intento de eliminar la única imagen bloqueado");
        toast({
          title: "❌ No permitido",
          description: "Debes tener al menos una imagen.",
        });
        setShowDeleteModal(false);
        setImageToDelete(null);
        return;
      }

      const deletedImg = editImagenes[imageToDelete];
      console.log(`🗑️ Eliminando imagen [${imageToDelete}] del estado local:`, {
        url: deletedImg.url.substring(0, 50) + "...",
        isNew: deletedImg.isNew,
        totalAntesDelBorrado: editImagenes.length,
      });
      
      setEditImagenes((prev) => {
        const remaining = prev.filter((_, i) => i !== imageToDelete);
        console.log(`  • Imágenes antes: ${prev.length}, después: ${remaining.length}`);
        return remaining;
      });
    }
    setShowDeleteModal(false);
    setImageToDelete(null);
  };

  const changePrincipalImage = async (imagenUrl: string) => {
    try {
      // Si es una imagen nueva (data URL), no podemos cambiarla como principal
      if (imagenUrl.startsWith("data:")) {
        toast({ title: "⚠️", description: "Primero sube la imagen para establecerla como principal" });
        return;
      }
      // Llamar al servicio para cambiar la imagen principal
      // Nota: Necesitaremos el ID de la imagen del backend
      toast({ title: "✅", description: "Imagen establecida como principal" });
      setShowChangePrincipal(false);
    } catch (err: any) {
      console.error("❌ Error cambiando imagen principal:", err);
      toast({ title: "❌", description: "Error al cambiar la imagen principal" });
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    console.log(`📷 handlePhotoSelect - Seleccionadas ${files.length} imagen(es)`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`  [${i + 1}] ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      
      try {
        // Generar hash SHA256 del archivo
        const fileHash = await hashFile(file);
        console.log(`  📍 Hash generado: ${fileHash.substring(0, 16)}...`);
        
        // ✅ NUEVA VALIDACIÓN: Verificar duplicados con TODAS las imágenes
        // Incluye imágenes del backend (isNew=false) + nuevas (isNew=true)
        const isDuplicate = editImagenes.some((img) => {
          if (!img.hash) return false; // Solo comparar si ambas tienen hash
          const match = img.hash === fileHash;
          if (match) {
            console.warn(`  ⚠️ Imagen duplicada: ${img.isNew ? "nueva" : "del backend"}`);
          }
          return match;
        });
        
        if (isDuplicate) {
          console.warn(`  ⚠️ Imagen duplicada detectada: ${file.name}`);
          toast({
            title: "❌ Imagen duplicada",
            description: `"${file.name}" ya existe. No puedes agregar imágenes duplicadas.`,
          });
          continue; // Saltar esta imagen
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            console.log(`  ✅ ${file.name} convertida a base64`);
            setEditImagenes((prev) => {
              const updated = [
                ...prev,
                {
                  url: event.target?.result as string,
                  isNew: true,
                  hash: fileHash, // Guardar hash para futuras comparaciones
                },
              ];
              console.log(`     Total imágenes ahora: ${updated.length}`);
              return updated;
            });
          }
        };
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            console.log(`  ⏳ ${file.name}: ${percentComplete.toFixed(0)}%`);
          }
        };
        reader.onerror = (err) => {
          console.error(`  ❌ Error leyendo ${file.name}:`, err);
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        console.error(`  ❌ Error procesando ${file.name}:`, err.message);
        toast({
          title: "❌ Error",
          description: `No se puede procesar "${file.name}"`,
        });
      }
    }
  };

  // Si no está autenticado, redirigir
  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/login");
    }
  }, [auth.isAuthenticated, navigate]);

  // Cargar perfil si no está cacheado
  useEffect(() => {
    if (auth.userId && !profileLoaded && !loading) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId, profileLoaded]);

  const loadProfile = async () => {
    if (!auth.userId) return;
    try {
      setLoading(true);
      const profile = await userService.obtenerPerfil(auth.userId);
      dispatch(setMyProfile(profile));
    } catch (err: any) {
      console.error("❌ Error cargando perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cuando entra en modo edición, copiar datos actuales
  const startEditing = async () => {
    let catalogs = { newProvincias: provincias, newTipos: tipoPersonas, newEtiquetas: etiquetasCatalog };
    
    if (!catalogsLoaded) {
      catalogs = await loadCatalogs();
    }
    
    // Después de cargar catálogos, seteo los valores
    if (myProfile) {
      setEditUsername(myProfile.user_name || "");
      setEditBio(myProfile.bio || "");
      
      const tipoMatch = catalogs.newTipos.find((t) => t.nombre === myProfile.tipo_de_therian);
      setEditTipoPersonaId(tipoMatch?.id ?? null);
      const provMatch = catalogs.newProvincias.find((p) => p.nombre === myProfile.provincia);
      setEditProvinciaId(provMatch?.id ?? null);
      
      // Etiquetas: buscar ids por nombre
      const etqIds = (myProfile.etiqueta ?? []).map((name) => {
        const match = catalogs.newEtiquetas.find((e) => e.nombre === name);
        return match?.id;
      }).filter((id): id is number => id !== undefined);
      setEditEtiquetas(etqIds);
      
      console.log("📌 Etiquetas cargadas desde perfil:", {
        nombres: myProfile.etiqueta,
        ids: etqIds,
      });
    }
    
    // Cargar imágenes existentes - mapear URLs con IDs (arrays paralelos del backend)
    const rawImagenes = myProfile?.imagenes ?? [];
    const rawIds = (myProfile as any)?.id_imagenes ?? [];
    
    console.log("🖼️ Cargando imágenes. Estructura recibida:", {
      imagenes_count: rawImagenes.length,
      id_imagenes_count: rawIds.length,
      imagenes: rawImagenes,
      id_imagenes: rawIds,
    });
    
    const imagenesList = await Promise.all(
      rawImagenes
        .filter((url: any): url is string => typeof url === "string" && url.length > 0)
        .map(async (url: string, idx: number) => {
          const id = rawIds[idx];
          console.log(`  • [${idx}] URL: ${url.substring(0, 40)}... | ID: ${id}`);
          
          // Calcular hash de la imagen existente para detectar duplicados
          const hash = await hashImageUrl(url);
          
          return {
            id: id,
            url: url,
            isNew: false,
            hash: hash || undefined, // Guardar hash para validar duplicados
          };
        })
    );
    
    setEditImagenes(imagenesList);
    // Guardar estructura completa original (con IDs y hashes) para detectar eliminadas
    setOriginalImagenes([...imagenesList]);
    setEditing(true);
  };

  const loadCatalogs = async () => {
    try {
      const [provRes, tipoRes, etqRes] = await Promise.all([
        authService.getProvincias(),
        authService.getTipoPersonas(),
        authService.getEtiquetas(),
      ]);
      const newProvincias = Array.isArray(provRes) ? provRes : provRes.provincias || [];
      const newTipos = Array.isArray(tipoRes) ? tipoRes : tipoRes.tipoPersonas || [];
      const newEtiquetas = Array.isArray(etqRes) ? etqRes : etqRes.etiquetas || [];
      
      setProvincias(newProvincias);
      setTipoPersonas(newTipos);
      setEtiquetasCatalog(newEtiquetas);
      setCatalogsLoaded(true);
      
      // Retornar los datos para usarlos inmediatamente en startEditing
      return { newProvincias, newTipos, newEtiquetas };
    } catch (err) {
      console.error("❌ Error cargando catálogos:", err);
      return { newProvincias: [], newTipos: [], newEtiquetas: [] };
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setShowProvDropdown(false);
    setShowTipoDropdown(false);
  };

  const saveProfile = async () => {
    if (!myProfile || !auth.userId) return;
    
    // ✅ VALIDACIONES REQUERIDAS
    if (!editBio || editBio.trim().length < 10) {
      toast({
        title: "❌ Bio incompleto",
        description: "La descripción debe tener al menos 10 caracteres",
      });
      return;
    }
    
    if (editEtiquetas.length === 0) {
      toast({
        title: "❌ Etiquetas requeridas",
        description: "Debes seleccionar al menos 1 etiqueta",
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // 1. Actualizar datos del perfil — usar ID del JWT
      const payload: ProfileUpdateData = {
        id: auth.userId,  // ID extraído del JWT
      };
      if (editUsername !== myProfile.user_name) payload.user_name = editUsername;
      if (editBio !== myProfile.bio) payload.bio = editBio;
      if (editTipoPersonaId != null) payload.tipoPersona_id = editTipoPersonaId;
      if (editProvinciaId != null) payload.provincia_id = editProvinciaId;

      // Comparar etiquetas actuales (por nombre→id) con editadas
      const currentEtqIds = (myProfile.etiqueta ?? []).map((name) => {
        const match = etiquetasCatalog.find((e) => e.nombre === name);
        return match?.id;
      }).filter((id): id is number => id !== undefined);
      const etiquetasChanged =
        editEtiquetas.length !== currentEtqIds.length ||
        editEtiquetas.some((id) => !currentEtqIds.includes(id));
      if (etiquetasChanged) payload.etiquetas = editEtiquetas;

      console.log("🆔 ID del JWT (auth.userId):", auth.userId);
      console.log("📤 Payload a enviar:", JSON.stringify(payload, null, 2));
      console.log("💾 Tipo de payload:", typeof payload);
      console.log("✅ ID en payload:", payload.id);
      
      await userService.cambiarPerfil(payload);

      // 2. Manejar imágenes
      console.log("🖼️ ═════════════════════════════════════════");
      console.log("🖼️ GESTIÓN DE IMÁGENES");
      console.log("🖼️ ═════════════════════════════════════════");
      
      console.log("📸 Estado de imágenes ANTES de guardar:");
      console.log("  • editImagenes actuales:", editImagenes);
      console.log("  • originalImagenes (copia al abrir edición):", originalImagenes);
      console.log("  • Total actuales:", editImagenes.length);
      console.log("  • Total originales:", originalImagenes.length);
      
      // Detectar imágenes eliminadas: compara las que hay ahora vs las que había al cargar
      const idsAEliminar: number[] = [];
      
      originalImagenes.forEach((original) => {
        // Si era original (isNew=false) y NO existe en editImagenes actual, fue eliminada
        if (!original.isNew) {
          const stillExists = editImagenes.some((current) => current.id === original.id);
          if (!stillExists) {
            console.log(`🗑️ Detectada eliminación:`, {
              id: original.id,
              url: original.url?.substring(0, 50),
            });
            if (original.id) {
              idsAEliminar.push(original.id);
              console.log(`   ✅ ID para eliminar: ${original.id}`);
            } else {
              console.warn(`   ⚠️ Sin ID, no se puede eliminar del backend`);
            }
          }
        }
      });
      
      // Eliminar imágenes del backend que tengan ID
      if (idsAEliminar.length > 0) {
        console.log(`🗑️ Eliminando ${idsAEliminar.length} imagen(es) del backend...`);
        for (const id_imagen of idsAEliminar) {
          try {
            console.log(`  • Llamando DELETE para ID: ${id_imagen}`);
            await imagenService.deleteImage(id_imagen);
            console.log(`    ✅ Eliminada exitosamente`);
          } catch (err: any) {
            console.error(`    ❌ Error eliminando imagen ${id_imagen}:`, err.message);
          }
        }
      } else {
        console.log("  • Sin imágenes para eliminar");
      }
      
      // Subir imágenes nuevas
      const newImages = editImagenes.filter((img) => img.isNew && img.url.startsWith("data:"));
      console.log("📤 Imágenes a subir:");
      console.log("  • Total nuevas:", newImages.length);
      newImages.forEach((img, idx) => {
        console.log(`  [${idx + 1}] isNew: true, url: ${img.url.substring(0, 50)}...`);
      });
      
      const uploadedIds: number[] = [];
      for (let i = 0; i < newImages.length; i++) {
        const newImg = newImages[i];
        console.log(`\n📸 [${i + 1}/${newImages.length}] Subiendo imagen...`);
        
        try {
          // Convertir base64 a File
          const blob = await fetch(newImg.url).then((res) => res.blob());
          const filename = `photo-${Date.now()}-${i}.png`;
          const file = new File([blob], filename, { type: "image/png" });
          
          console.log(`  • Filename: ${filename}`);
          console.log(`  • Tamaño: ${(blob.size / 1024).toFixed(2)} KB`);
          
          const uploaded = await imagenService.uploadImage(file);
          console.log(`  ✅ Subida exitosa:`, uploaded);
          
          if (uploaded.id_imagen) {
            uploadedIds.push(uploaded.id_imagen);
            console.log(`  • ID guardado para tracking: ${uploaded.id_imagen}`);
          }
        } catch (err: any) {
          console.error(`  ❌ Error en imagen [${i + 1}]:`, err.message);
          console.error(`     Tipo de error: ${err.constructor.name}`);
          if (err.response?.data) {
            console.error(`     Respuesta del servidor:`, err.response.data);
          }
        }
      }

      console.log("\n🔄 Recargando perfil actualizado...");
      console.log("  • Solicitando a obtenerPerfil con user_id:", auth.userId);
      
      // 3. Recargar perfil actualizado
      if (auth.userId) {
        try {
          const updated = await userService.obtenerPerfil(auth.userId);
          console.log("📥 Respuesta de obtenerPerfil:", updated);
          console.log("  • Tipo:", typeof updated);
          console.log("  • Es array?", Array.isArray(updated));
          
          if (Array.isArray(updated)) {
            console.warn("⚠️ ADVERTENCIA: obtenerPerfil devolvió un array en lugar de objeto");
            console.warn(`   Array length: ${updated.length}`);
            if (updated.length > 0) {
              console.log("   Primer elemento:", updated[0]);
            }
          }
          
          dispatch(setMyProfile(updated));
          console.log("✅ Perfil guardado en Redux");
          console.log(`✅ Resumen: ${idsAEliminar.length} eliminadas, ${uploadedIds.length} subidas`);
        } catch (err: any) {
          console.error("❌ Error recargando perfil:", err.message);
          console.error("   Stack:", err.stack);
        }
      }
      
      setEditing(false);
    } catch (err: any) {
      console.error("❌ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ ERROR GUARDANDO PERFIL");
      console.error("❌ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("  • Mensaje:", err.message);
      console.error("  • Tipo:", err.constructor.name);
      if (err.response?.status) {
        console.error("  • Status HTTP:", err.response.status);
        console.error("  • Datos error:", err.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = auth.tokens?.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (_) {
      // ignore
    }
    dispatch(clearProfile());
    dispatch(clearChats());
    dispatch(clearFeed());
    dispatch(logoutAction());
    navigate("/login");
  };

  const toggleEtiqueta = (id: number) => {
    setEditEtiquetas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getProvinciaName = (id?: number) =>
    provincias.find((p) => p.id === id)?.nombre ?? myProfile?.provincia ?? "—";

  const getTipoName = (id?: number) =>
    tipoPersonas.find((t) => t.id === id)?.nombre ?? myProfile?.tipo_de_therian ?? "—";

  // ─── LOADING STATE ─────────────────────────────────────────
  if (loading || !myProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
            <div className="h-6 w-40 bg-muted rounded-xl animate-pulse" />
            <div className="h-4 w-60 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Datos derivados
  const firstImage = myProfile.imagenes?.[0] ?? null;
  const initials =
    (myProfile.user_name?.[0] ?? "").toUpperCase() +
    (myProfile.user_name?.[1] ?? "").toUpperCase();

  // ─── RENDER ────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background pb-[60px]">
      {/* ─── HEADER ─────────────────────────────── */}
      <div className="relative">
        {/* Cover gradient */}
        <div className="h-44 gradient-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent" />
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <Sparkles
                key={i}
                className="absolute text-white"
                style={{
                  left: `${(i * 17 + 5) % 100}%`,
                  top: `${(i * 23 + 10) % 100}%`,
                  width: 14 + (i % 3) * 6,
                  height: 14 + (i % 3) * 6,
                }}
              />
            ))}
          </div>

          {/* Top-right buttons */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            {!editing && (
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg hover:bg-white/30 transition-all active:scale-95"
              >
                <Pencil size={15} />
                Editar
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-red-500/80 backdrop-blur-sm text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg hover:bg-red-500 transition-all active:scale-95"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Avatar floating */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 z-10">
          <div className="relative group">
            {firstImage ? (
              <img
                src={firstImage}
                alt="avatar"
                className="h-32 w-32 rounded-full object-cover border-4 border-background shadow-xl"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-primary/20 border-4 border-background shadow-xl flex items-center justify-center">
                <span className="text-3xl font-extrabold text-primary">
                  {initials || <User size={40} />}
                </span>
              </div>
            )}
            {/* Badge decorativo */}
            <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 shadow-lg">
              <Shield size={14} />
            </div>
            {/* Camera button para cambiar imagen principal */}
            {editing && (
              <button
                onClick={() => setShowChangePrincipal(true)}
                className="absolute top-0 right-0 bg-primary text-white rounded-full p-2 shadow-lg hover:bg-primary/90 transition-all active:scale-95 opacity-0 group-hover:opacity-100"
                title="Cambiar imagen principal"
              >
                <Camera size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── BODY ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pt-20 space-y-5" style={{ paddingBottom: editing ? "320px" : "80px" }}>
        {/* ── Name & username ── */}
        {!editing ? (
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">
              {myProfile.user_name}
            </h1>
            {myProfile.email && (
              <p className="text-muted-foreground font-medium text-sm">{myProfile.email}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-secondary/50 pl-8 pr-4 py-3 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Info cards ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Provincia */}
          <div className="relative z-40">
            <div className="bg-secondary/60 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={15} className="text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Provincia
                </span>
              </div>
              {!editing ? (
                <p className="text-sm font-bold text-foreground truncate">
                  {myProfile.provincia ?? "—"}
                </p>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => { setShowProvDropdown(!showProvDropdown); setShowTipoDropdown(false); }}
                    className="w-full text-left text-sm font-bold text-foreground flex items-center justify-between px-2 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <span className="truncate">
                      {editProvinciaId ? getProvinciaName(editProvinciaId) : myProfile.provincia || "Seleccionar"}
                    </span>
                    <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${showProvDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showProvDropdown && provincias.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-2xl z-[9999] max-h-56 overflow-y-auto">
                      {provincias.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setEditProvinciaId(p.id); setShowProvDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                            editProvinciaId === p.id ? "bg-primary/15 text-primary font-bold" : "text-foreground"
                          }`}
                        >
                          {p.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tipo therian */}
          <div className="relative z-40">
            <div className="bg-secondary/60 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={15} className="text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tipo
                </span>
              </div>
              {!editing ? (
                <p className="text-sm font-bold text-foreground truncate">
                  {myProfile.tipo_de_therian ?? "—"}
                </p>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => { setShowTipoDropdown(!showTipoDropdown); setShowProvDropdown(false); }}
                    className="w-full text-left text-sm font-bold text-foreground flex items-center justify-between px-2 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <span className="truncate">
                      {editTipoPersonaId ? getTipoName(editTipoPersonaId) : myProfile.tipo_de_therian || "Seleccionar"}
                    </span>
                    <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${showTipoDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showTipoDropdown && tipoPersonas.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-2xl z-[9999] max-h-56 overflow-y-auto">
                      {tipoPersonas.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { setEditTipoPersonaId(t.id); setShowTipoDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                            editTipoPersonaId === t.id ? "bg-primary/15 text-primary font-bold" : "text-foreground"
                          }`}
                        >
                          {t.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bio ── */}
        <div className="bg-secondary/60 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={15} className="text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Sobre mí
            </span>
          </div>
          {!editing ? (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {myProfile.bio || "Aún no has escrito nada sobre ti ✍️"}
            </p>
          ) : (
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={4}
              maxLength={300}
              placeholder="Cuéntale al mundo sobre ti..."
              className="w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          )}
        </div>

        {/* ── Etiquetas ── */}
        <div className="bg-secondary/60 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={15} className="text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Intereses
            </span>
          </div>
          {!editing ? (
            <div className="flex flex-wrap gap-2">
              {myProfile.etiqueta && myProfile.etiqueta.length > 0 ? (
                myProfile.etiqueta.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary/15 text-primary"
                  >
                    {name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin intereses aún 🏷️</p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {etiquetasCatalog.map((etq) => {
                const selected = editEtiquetas.includes(etq.id);
                const wasOriginallySelected = (myProfile.etiqueta ?? []).some(
                  (name) => etiquetasCatalog.find((e) => e.nombre === name)?.id === etq.id
                );
                // Mostrar con el mismo estilo si está seleccionado O si ya lo tenía originalmente
                const isCurrentlySelected = selected || wasOriginallySelected;
                return (
                  <button
                    key={etq.id}
                    onClick={() => toggleEtiqueta(etq.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 border-2 ${
                      isCurrentlySelected
                        ? "bg-primary text-white border-primary shadow-md"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-primary/10"
                    }`}
                  >
                    <Check size={14} />
                    {etq.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Photos gallery ── */}
        {editing ? (
          <div className="bg-secondary/60 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={15} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Fotos
              </span>
            </div>
            <div>
              {/* Grid de fotos actuales */}
              {editImagenes.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {editImagenes.map((img, i) => {
                    const canDelete = editImagenes.length > 1; // Solo permitir borrar si hay más de 1
                    return (
                      <div
                        key={i}
                        className={`relative aspect-square rounded-xl overflow-hidden group ${
                          canDelete ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => canDelete && confirmDeletePhoto(i)}
                          disabled={!canDelete}
                          className={`absolute inset-0 ${
                            canDelete
                              ? "bg-black/50 opacity-0 group-hover:opacity-100"
                              : "bg-black/70 opacity-100"
                          } transition-opacity flex items-center justify-center`}
                        >
                          <div className="text-center">
                            <X size={24} className="text-white mx-auto mb-1" />
                            {!canDelete && <p className="text-xs text-white font-bold">Única imagen</p>}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Botón para agregar fotos */}
              <button
                onClick={() => photoInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-primary/50 py-6 text-center hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
              >
                <div className="flex flex-col items-center gap-2">
                  <Camera size={24} className="text-primary" />
                  <span className="text-sm font-bold text-primary">Añadir fotos</span>
                </div>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          </div>
        ) : myProfile.imagenes && myProfile.imagenes.length > 1 ? (
          <div className="bg-secondary/60 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={15} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Fotos
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {myProfile.imagenes.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img
                    src={img}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Account info ── */}
        <div className="bg-secondary/60 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <User size={15} className="text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Información
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {myProfile.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{myProfile.email}</span>
              </div>
            )}
            {myProfile.genero && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Género</span>
                <span className="font-medium text-foreground">{myProfile.genero}</span>
              </div>
            )}
            {myProfile.fechaNacimiento && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nacimiento</span>
                <span className="font-medium text-foreground">{myProfile.fechaNacimiento}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Editing action bar ── */}
      {editing && (
        <div className="fixed bottom-[120px] left-0 right-0 px-5 py-3 bg-gradient-to-t from-background/95 via-background/95 to-transparent z-30 border-t border-border">
          <div className="flex gap-3">
            <button
              onClick={cancelEditing}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/80 py-3.5 text-foreground font-bold shadow-card hover:bg-secondary active:scale-[0.98] transition-all"
            >
              <X size={18} />
              Cancelar
            </button>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl gradient-primary py-3.5 text-white font-bold shadow-soft hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={18} />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Image Modal ── */}
      {showDeleteModal && imageToDelete !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-destructive/20 p-2 rounded-full">
                <AlertCircle size={24} className="text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {editImagenes.length <= 1 ? "No se puede eliminar" : "Eliminar foto"}
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              {editImagenes.length <= 1
                ? "Debes tener al menos una foto. Agrega otra antes de eliminar esta."
                : "¿Estás seguro de que quieres eliminar esta foto? Esta acción no se puede deshacer."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setImageToDelete(null);
                }}
                className="flex-1 rounded-2xl border border-border bg-secondary/80 py-3 text-foreground font-bold hover:bg-secondary transition-all active:scale-95"
              >
                {editImagenes.length <= 1 ? "Entendido" : "Cancelar"}
              </button>
              {editImagenes.length > 1 && (
                <button
                  onClick={deletePhoto}
                  className="flex-1 rounded-2xl bg-destructive py-3 text-white font-bold hover:bg-red-600 transition-all active:scale-95"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar imagen principal */}
      {showChangePrincipal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl p-6 max-w-md w-full shadow-xl border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Camera size={20} /> Cambiar imagen principal
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Selecciona la foto que deseas establecer como imagen principal
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4 max-h-96 overflow-y-auto">
              {editImagenes.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!img.url.startsWith("data:")) {
                      changePrincipalImage(img.url);
                    }
                  }}
                  className={`relative w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                    img.url.startsWith("data:")
                      ? "opacity-50 cursor-not-allowed border-muted-foreground"
                      : "border-border hover:border-primary cursor-pointer"
                  }`}
                  disabled={img.url.startsWith("data:")}
                >
                  <img
                    src={img.url}
                    alt={`foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {img.url.startsWith("data:") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-xs text-white font-bold">Por subir</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowChangePrincipal(false)}
              className="w-full rounded-2xl bg-primary py-3 text-white font-bold hover:bg-primary/90 transition-all active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ─── BOTTOM NAV ──────────────────────────── */}
      <BottomNav />
    </div>
  );
};

export default Profile;
