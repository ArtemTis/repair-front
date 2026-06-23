import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminApp from "./AdminApp";

const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
const storedToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={<AdminApp accessToken={storedToken ?? undefined} />}
        />
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
