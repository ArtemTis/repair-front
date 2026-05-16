import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IAuthUser, IUser } from "../types";

const AUTH_STORAGE_KEY = "techservice_current_user";

interface AuthState {
  user: IAuthUser | null;
}

const readStoredUser = (): IAuthUser | null => {
  try {
    const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return rawUser ? (JSON.parse(rawUser) as IAuthUser) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const saveUser = (user: IAuthUser | null) => {
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

const initialState: AuthState = {
  user: readStoredUser(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<IUser | IAuthUser>) => {
      const { password: _password, ...safeUser } = action.payload as IUser;
      state.user = safeUser;
      saveUser(safeUser);
    },
    logout: (state) => {
      state.user = null;
      saveUser(null);
    },
  },
});

export const { logout, setCurrentUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
