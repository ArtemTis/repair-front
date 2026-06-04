import { useEffect } from 'react';
import { useRefreshMutation } from '../api/authApi';
import { logout, setCredentials } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    refresh()
      .unwrap()
      .then((response) => {
        dispatch(setCredentials(response));
      })
      .catch(() => {
        dispatch(logout());
      });
  }, [dispatch, refresh]);

  return <>{children}</>;
};