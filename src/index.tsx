import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
// AdminRoute ersatt av ProtectedRoute med requiredRole
import { DashboardRedesign } from "./screens/DashboardRedesign";
import { KunderPage } from "./screens/KunderPage";
import { CustomerProfile } from "./screens/KunderPage/CustomerProfile";
import { RegisteraTidPage } from "./screens/RegistreraTidPage";
import { ArendelistaPage } from "./screens/ArendelistaPage";
import { StatistikPage } from "./screens/StatistikPage";
import { AdminPage } from "./screens/AdminPage";
import MinProfilPage from "./screens/MinProfilPage";
import { LoginPage } from "./screens/LoginPage";

import { InviteAcceptPage } from "./screens/InviteAcceptPage";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:token" element={<InviteAcceptPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedesign /></ProtectedRoute>} />
          <Route path="/kunder" element={<ProtectedRoute><KunderPage /></ProtectedRoute>} />
          <Route path="/kunder/:id" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />
          <Route path="/registrera-tid" element={<ProtectedRoute><RegisteraTidPage /></ProtectedRoute>} />
          <Route path="/arendelista" element={<ProtectedRoute><ArendelistaPage /></ProtectedRoute>} />
          <Route path="/statistik" element={<ProtectedRoute><StatistikPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>} />
          <Route path="/min-profil" element={<ProtectedRoute><MinProfilPage /></ProtectedRoute>} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);