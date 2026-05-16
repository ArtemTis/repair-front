import { Header } from "../../Header/ui/Header";
import { useLocation } from "react-router-dom";
import { RoutePath } from "../../../shared/config/routerConfig";
import "./Layout.css";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const isChatPage = pathname === RoutePath.chat;
  const isAuthPage = pathname === RoutePath.auth;

  return (
    <div className={`layout ${isChatPage ? "layout--chat" : ""}`}>
      {!isAuthPage && <Header />}
      <main
        className={`layout__main ${isChatPage ? "layout__main--chat" : ""} ${
          isAuthPage ? "layout__main--auth" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
};
