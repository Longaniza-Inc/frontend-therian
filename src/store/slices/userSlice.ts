import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile, ProfileData } from "@/types";

interface UserState {
  profile: UserProfile | null;
  /** Perfil completo del usuario logueado (cacheado) */
  myProfile: ProfileData | null;
  /** Indica si el perfil ya fue cargado al menos una vez */
  profileLoaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  myProfile: null,
  profileLoaded: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile>) {
      state.profile = action.payload;
      state.loading = false;
    },
    setMyProfile(state, action: PayloadAction<ProfileData>) {
      state.myProfile = action.payload;
      state.profileLoaded = true;
      state.loading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearProfile(state) {
      state.profile = null;
      state.myProfile = null;
      state.profileLoaded = false;
    },
  },
});

export const { setProfile, setMyProfile, setLoading, setError, clearProfile } = userSlice.actions;
export default userSlice.reducer;
