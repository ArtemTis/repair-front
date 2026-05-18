import { NavLink } from "react-router-dom";
import { RoutePath } from "../../../shared/config/routerConfig";
import { logout } from "../../../shared/store/authSlice";
import { useAppDispatch, useAppSelector } from "../../../shared/store/hooks";
import "./Header.css";

export const Header = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const getLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `header__link ${isActive ? "header__link--active" : ""}`.trim();

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__brand">
          <span className="header__logo" aria-hidden="true">
            TS
          </span>
          <h1 className="header__title">TechService AI</h1>
        </div>
        <nav className="header__nav">
          <NavLink to={RoutePath.chat} className={getLinkClassName}>
            Чат с помощником
          </NavLink>
          <NavLink to={RoutePath.history} className={getLinkClassName}>
            История починок
          </NavLink>
          <NavLink to={RoutePath.articles} className={getLinkClassName}>
            Статьи
          </NavLink>
          <NavLink to={RoutePath.services} className={getLinkClassName}>
            Сервисные центры
          </NavLink>
          <NavLink to={RoutePath.profile} className={getLinkClassName}>
            Профиль
          </NavLink>
        </nav>
        <div className="header__user">
          {currentUser && (
            <span className="header__user-name">{currentUser.full_name}</span>
          )}
          <button
            className="header__logout"
            type="button"
            onClick={() => dispatch(logout())}
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};
