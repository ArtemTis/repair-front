import { lazy } from "react";
import { RouteProps } from "react-router-dom";
const AuthPage = lazy(() => import("../../pages/AuthPage/AuthPage"));
const ChatPage = lazy(() => import("../../pages/ChatPage/ChatPage"));
const HistoryPage = lazy(() => import("../../pages/HistoryPage/HistoryPage"));
const ProfilePage = lazy(() => import("../../pages/ProfilePage/ProfilePage"));
const DevicesPage = lazy(() => import("../../pages/ProfilePage/DevicesPage"));
const SkillsPage = lazy(() => import("../../pages/ProfilePage/SkillsPage"));
const ArticlesPage = lazy(() => import("../../pages/ArticlesPage/ArticlesPage"));
const ServicesPage = lazy(() => import("../../pages/ServicesPage/ServicesPage"));

export enum AppRoutes {
  AUTH = "auth",
  CHAT = "chat",
  HISTORY = "history",
  ARTICLES = "articles",
  SERVICES = "services",
  PROFILE = "profile",
  SKILLS = "skills",
  DEVICES = "devices"
}

export const RoutePath: Record<AppRoutes, string> = {
  [AppRoutes.AUTH]: "/auth",
  [AppRoutes.CHAT]: "/",
  [AppRoutes.HISTORY]: "/history",
  [AppRoutes.ARTICLES]: "/articles",
  [AppRoutes.SERVICES]: "/services",
  [AppRoutes.PROFILE]: "/profile",
  [AppRoutes.DEVICES]: "/profile/devices",
  [AppRoutes.SKILLS]: "/profile/skills"
};

export const routerConfig: Record<AppRoutes, RouteProps> = {
  [AppRoutes.AUTH]: {
    path: RoutePath.auth,
    element: <AuthPage />,
  },
  [AppRoutes.CHAT]: {
    path: RoutePath.chat,
    element: <ChatPage />,
  },
  [AppRoutes.HISTORY]: {
    path: `${RoutePath.history}/*`,
    element: <HistoryPage />,
  },
  [AppRoutes.ARTICLES]: {
    path: `${RoutePath.articles}/*`,
    element: <ArticlesPage />,
  },
  [AppRoutes.SERVICES]: {
    path: RoutePath.services,
    element: <ServicesPage />,
  },
  [AppRoutes.PROFILE]: {
    path: RoutePath.profile,
    element: <ProfilePage />,
  },
  [AppRoutes.DEVICES]: {
    path: RoutePath.devices,
    element: <DevicesPage />,
  },
  [AppRoutes.SKILLS]: {
    path: RoutePath.skills,
    element: <SkillsPage />,
  }
};
