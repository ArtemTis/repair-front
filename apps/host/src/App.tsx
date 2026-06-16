import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppRoutes, RoutePath, routerConfig } from "./shared/config/routerConfig";
import { useAppSelector } from "./shared/store/hooks";
import { Layout } from "./widgets/Layout/ui/Layout";
import { AuthInitializer } from "./shared/config/AuthInitializer";
import { PageLoader } from "./shared/ui/PageLoader/PageLoader";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAuthReady = useAppSelector((state) => state.auth.isAuthReady);

  if (!isAuthReady) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return <Navigate to={RoutePath.auth} replace />;
  }

  return <>{children}</>;
};

const renderRoute = (routeName: string, path?: string, element?: React.ReactNode) => {
  const isAuthRoute = routeName === AppRoutes.AUTH;

  return (
    <Route
      key={path}
      path={path}
      element={
        isAuthRoute ? element : <ProtectedRoute>{element}</ProtectedRoute>
      }
    />
  );
};

export const App = () => {
  const layoutRoutes = Object.entries(routerConfig).filter(
    ([, config]) => !config.withoutLayout
  );
  const standaloneRoutes = Object.entries(routerConfig).filter(
    ([, config]) => config.withoutLayout
  );

  return (
    <AuthInitializer>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {standaloneRoutes.map(([routeName, { path, element }]) =>
            renderRoute(routeName, path, element)
          )}
          <Route
            path="*"
            element={
              <Layout>
                <Routes>
                  {layoutRoutes.map(([routeName, { path, element }]) =>
                    renderRoute(routeName, path, element)
                  )}
                  <Route path="*" element={<Navigate to={RoutePath.chat} replace />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Suspense>
    </AuthInitializer>
  );
};
