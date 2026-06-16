import { useRef } from "react";
import { setAccessToken } from "../store/authSlice";
import { useAppDispatch } from "../store/hooks";

type AdminAuthSyncProps = {
  token?: string;
};

export const AdminAuthSync = ({ token }: AdminAuthSyncProps) => {
  const dispatch = useAppDispatch();
  const syncedToken = useRef<string | null | undefined>(undefined);

  if (syncedToken.current !== token) {
    syncedToken.current = token;
    dispatch(setAccessToken(token ?? null));
  }

  return null;
};
