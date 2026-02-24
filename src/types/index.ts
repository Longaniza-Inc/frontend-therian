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

// Auth response from Google callback
export interface GoogleCallbackResponse {
  resultado?: string;
  id_google?: string;
  email?: string;
  access_token?: string;
  token_type?: string;
}

// Auth tokens stored locally
export interface AuthTokens {
  accessToken: string;
  tokenType: string;
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

// Chat conversation preview
export interface ChatPreview {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  therianType: TherianType;
}

// Swipe actions
export type SwipeAction = "like" | "dislike" | "undo" | "report";

export interface SwipePayload {
  targetUserId: string;
  action: SwipeAction;
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
