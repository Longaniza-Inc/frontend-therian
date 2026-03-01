import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { FeedCard } from "@/types";

/* ═══════════════════════════════════════
   INTERFACES
   ═══════════════════════════════════════ */

interface FilterOptions {
  provincias: Array<{ id_provincia: number; nombre_provincia: string }>;
  tipos_persona: Array<{ id_tipo_persona: number; nombre_tipo_persona: string }>;
  generos: Array<{ id_genero: number; nombre_genero: string }>;
}

interface FeedState {
  /** Tarjetas del feed cacheadas */
  cards: FeedCard[];
  /** Índice actual de la tarjeta visible */
  currentIndex: number;
  /** Opciones de filtros cacheadas */
  filterOptions: FilterOptions | null;
  /** Se cargaron las tarjetas al menos una vez */
  cardsLoaded: boolean;
  /** Se cargaron las opciones de filtro al menos una vez */
  filterOptionsLoaded: boolean;
  /** Indica si se está haciendo refresh en background */
  isRefreshing: boolean;
  /** Error en la última carga */
  error: string | null;
}

const initialState: FeedState = {
  cards: [],
  currentIndex: 0,
  filterOptions: null,
  cardsLoaded: false,
  filterOptionsLoaded: false,
  isRefreshing: false,
  error: null,
};

/* ═══════════════════════════════════════
   SLICE
   ═══════════════════════════════════════ */

const feedSlice = createSlice({
  name: "feed",
  initialState,
  reducers: {
    /** Guardar tarjetas del feed (reemplaza las anteriores) */
    setFeedCards(state, action: PayloadAction<FeedCard[]>) {
      state.cards = action.payload;
      state.currentIndex = 0;
      state.cardsLoaded = true;
      state.isRefreshing = false;
      state.error = null;
    },

    /** Avanzar al siguiente índice (like/dislike) */
    advanceIndex(state) {
      state.currentIndex += 1;
    },

    /** Retroceder (undo) */
    rewindIndex(state) {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
      }
    },

    /** Setear índice directamente */
    setCurrentIndex(state, action: PayloadAction<number>) {
      state.currentIndex = action.payload;
    },

    /** Guardar opciones de filtro */
    setFilterOptions(state, action: PayloadAction<FilterOptions>) {
      state.filterOptions = action.payload;
      state.filterOptionsLoaded = true;
    },

    /** Marcar que se está refrescando en background */
    setRefreshing(state, action: PayloadAction<boolean>) {
      state.isRefreshing = action.payload;
    },

    /** Guardar error */
    setFeedError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isRefreshing = false;
    },

    /** Limpiar todo (logout) */
    clearFeed(state) {
      state.cards = [];
      state.currentIndex = 0;
      state.filterOptions = null;
      state.cardsLoaded = false;
      state.filterOptionsLoaded = false;
      state.isRefreshing = false;
      state.error = null;
    },
  },
});

export const {
  setFeedCards,
  advanceIndex,
  rewindIndex,
  setCurrentIndex,
  setFilterOptions,
  setRefreshing,
  setFeedError,
  clearFeed,
} = feedSlice.actions;

export default feedSlice.reducer;
