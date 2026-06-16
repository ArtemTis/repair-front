import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";

export const ADMIN_BASE_PATH = "/admin";

const AdminRoutes = () => (
  <Routes>
    <Route index element={<DashboardPage />} />
    <Route path="users" element={<UsersPage />} />
    <Route path="*" element={<Navigate to={ADMIN_BASE_PATH} replace />} />
  </Routes>
);

export const App = () => {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark">RA</span>
          <div>
            <strong>Repair Admin</strong>
            <small>remote workspace</small>
          </div>
        </div>

        <nav className="nav">
          <NavLink to={ADMIN_BASE_PATH} end>
            Статистика
          </NavLink>
          <NavLink to={`${ADMIN_BASE_PATH}/users`}>Пользователи</NavLink>
        </nav>
      </aside>

      <main className="content">
        <AdminRoutes />
      </main>
    </div>
  );
};