// src/App.tsx
import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppRoutes, RoutePath, routerConfig } from "./shared/config/routerConfig";
import { useAppSelector } from "./shared/store/hooks";
import { Layout } from "./widgets/Layout/ui/Layout";
import { AuthInitializer } from "./shared/config/AuthInitializer";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAuthReady = useAppSelector((state) => state.auth.isAuthReady);

  if (!isAuthReady) {
    return <div>Загрузка...</div>;
  }

  if (!currentUser) {
    return <Navigate to={RoutePath.auth} replace />;
  }

  return <>{children}</>;
};

export const App = () => {
  return (
    <Layout>
      <AuthInitializer>
        <Suspense fallback={<div>Загрузка...</div>}>
          <Routes>
            {Object.entries(routerConfig).map(([routeName, { path, element }]) => {
              const isAuthRoute = routeName === AppRoutes.AUTH;

              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    isAuthRoute ? (
                      element
                    ) : (
                      <ProtectedRoute>{element}</ProtectedRoute>
                    )
                  }
                />
              );
            })}
            <Route path="*" element={<Navigate to={RoutePath.chat} replace />} />
          </Routes>
        </Suspense>
      </AuthInitializer>
    </Layout>
  );
};
