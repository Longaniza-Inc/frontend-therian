// Therian types
export type TherianType = "zorro" | "lobo" | "no_therian" | "apoyo";

export const THERIAN_TYPES: { value: TherianType; label: string; emoji: string }[] = [
  { value: "zorro", label: "Zorro", emoji: "🦊" },
  { value: "lobo", label: "Lobo", emoji: "🐺" },
  { value: "no_therian", label: "No Therian", emoji: "🙂" },
  { value: "apoyo", label: "Apoyo a Therians", emoji: "💚" },
];

// Gender
export interface Genero {
  id: number;
  nombre: string;
}

// Province
export interface Provincia {
  id: number;
  nombre: string;
}

// User creation DTO (matches backend UsuarioCreate)
export interface UsuarioCreate {
  nombre: string;
  user_name: string;
  email: string;
  pwd: string;
  bio: string;
  FechaNacimiento: string;
  FechaCreacion: string;
  tipoPersona_id: number;
  provincia_id: number;
  genero_id: number;
  google_id: string;
  imagenes: Array<{ url: string; es_principal: boolean }>;
  etiquetas: number[];
}

// Auth response from Google/backend endpoints
export interface GoogleCallbackResponse {
  // Para usuario existente
  user?: {
    id: number;
    email: string;
    google_id: string;
    [key: string]: any;
  };
  access_token?: string;
  token_type?: string;
  refresh_token?: string;
  user_id?: number;
  
  // Para usuario nuevo
  is_new_user?: boolean;
  google_id?: string;
  email?: string;
  name?: string;
  picture?: string;
  
  // Legacy/fallbacks
  id_google?: string;
  token_typeA?: string;
}

// Auth tokens stored locally
export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  refreshToken?: string;
  userId?: number;
}

// User profile
export interface UserProfile {
  id: string;
  name: string;
  surname: string;
  username: string;
  birthdate: string;
  phone: string;
  province: string;
  bio: string;
  therianType: TherianType;
  interests: string[];
  profilePhoto: string | null;
  additionalPhotos: string[];
  age: number;
  createdAt: string;
  updatedAt: string;
}

// Profile data from backend (GET /usuario/perfil/obtener)
export interface ProfileData {
  id: number;
  user_name: string;
  bio: string;
  email?: string;
  genero?: string;
  tipo_de_therian?: string;
  fechaNacimiento?: string;
  provincia?: string;
  imagenes?: string[];
  etiqueta?: string[];
  [key: string]: any; // backend puede devolver campos extra
}

// Profile update payload (POST /usuario/perfil/cambiar)
export interface ProfileUpdateData {
  id: number;
  nombre?: string;
  user_name?: string;
  bio?: string;
  tipoPersona_id?: number;
  provincia_id?: number;
  etiquetas?: number[];
}

// Description section for each photo slide
export interface DescriptionSection {
  title: string;
  content: string;
}

// Feed card (what comes from API)
export interface FeedCard {
  id: string;
  name: string;
  age: number;
  therianType: TherianType;
  bio: string;
  photos: string[];
  descriptionSections: DescriptionSection[];
  distance?: number;
}

// Chat message
export interface Mensaje {
  id_mensaje: number;
  id_emisor: number | string;
  contenido: string;
  fecha: string;
  esLeido: boolean;
}

// Chat conversation preview
export interface ChatPreview {
  id_chat: number;
  id_usuario?: number; // ID del usuario actual
  otro_usuario_id: number | string;
  otro_usuario_nombre: string;
  fecha_ultimo_mensaje: string;
  ultimo_mensaje?: string;
  esLeido?: boolean;
}

// Swipe actions
export type SwipeAction = "like" | "dislike" | "undo" | "report";

export interface SwipePayload {
  targetUserId: string;
  action: SwipeAction;
}

// Like model (matches backend LikeM)
export interface LikeM {
  liker_id: number;
  liked_id: number;
  es_like: boolean; // true for like, false for dislike
  created_at: string; // ISO datetime string
}

// Like response from backend
export interface LikeResponse {
  hubo_match: boolean;
  id_match: number | null;
  id_chat: number | null;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  totalPages: number;
  total: number;
}
