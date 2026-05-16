import { RouteProps } from "react-router-dom";
import AuthPage from "../../pages/AuthPage/AuthPage";
import ChatPage from "../../pages/ChatPage/ChatPage";
import HistoryPage from "../../pages/HistoryPage/HistoryPage";
import ProfilePage from "../../pages/ProfilePage/ProfilePage";
import DevicesPage from "../../pages/ProfilePage/DevicesPage";
import SkillsPage from "../../pages/ProfilePage/SkillsPage";
import ArticlesPage from "../../pages/ArticlesPage/ArticlesPage";

export enum AppRoutes {
  AUTH = "auth",
  CHAT = "chat",
  HISTORY = "history",
  ARTICLES = "articles",
  PROFILE = "profile",
  SKILLS = "skills",
  DEVICES = "devices"
}

export const RoutePath: Record<AppRoutes, string> = {
  [AppRoutes.AUTH]: "/auth",
  [AppRoutes.CHAT]: "/",
  [AppRoutes.HISTORY]: "/history",
  [AppRoutes.ARTICLES]: "/articles",
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
