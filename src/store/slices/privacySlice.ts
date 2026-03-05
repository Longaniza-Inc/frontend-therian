import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PrivacyState {
  termsAccepted: boolean;
  acceptanceDate: string | null;
}

const initialState: PrivacyState = {
  termsAccepted: false,
  acceptanceDate: null,
};

// Cargar estado desde localStorage
const loadPrivacyFromStorage = (): PrivacyState => {
  try {
    const stored = localStorage.getItem("privacy_state");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("❌ Error recuperando privacy state:", error);
  }
  return initialState;
};

const privacySlice = createSlice({
  name: "privacy",
  initialState: loadPrivacyFromStorage(),
  reducers: {
    acceptTerms: (state) => {
      state.termsAccepted = true;
      state.acceptanceDate = new Date().toISOString();
      localStorage.setItem("privacy_state", JSON.stringify(state));
    },
    rejectTerms: (state) => {
      state.termsAccepted = false;
      state.acceptanceDate = null;
      localStorage.removeItem("privacy_state");
    },
    resetPrivacy: (state) => {
      state.termsAccepted = false;
      state.acceptanceDate = null;
      localStorage.removeItem("privacy_state");
    },
  },
});

export const { acceptTerms, rejectTerms, resetPrivacy } = privacySlice.actions;
export default privacySlice.reducer;
