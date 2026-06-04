import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IAuthResponse, IAuthUser, IUser } from "../types";

const AUTH_STORAGE_KEY = "techservice_current_user";

interface AuthState {
  user: IAuthUser | null;
  accessToken: string | null;
  isAuthReady: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthReady: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<IAuthResponse>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthReady = true;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthReady = true;
    },
    finishAuthCheck(state) {
      state.isAuthReady = true;
    },
    setCurrentUser: (state, action: PayloadAction<IAuthUser>) => {
      state.user = action.payload;
    },
  },
});

export const { logout, setCredentials, finishAuthCheck, setAccessToken, setCurrentUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
