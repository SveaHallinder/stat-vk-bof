import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./globals.css";
import { validateEnv } from "./config/env";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
// AdminRoute ersatt av ProtectedRoute med requiredRole
import { lazy } from "react";
const DashboardRedesign = lazy(() => import("./screens/DashboardRedesign").then(m => ({ default: m.DashboardRedesign })));
const KunderPage = lazy(() => import("./screens/KunderPage").then(m => ({ default: m.KunderPage })));
const CustomerProfile = lazy(() => import("./screens/KunderPage/CustomerProfile").then(m => ({ default: m.CustomerProfile })));
const RegisteraTidPage = lazy(() => import("./screens/RegistreraTidPage").then(m => ({ default: m.RegisteraTidPage })));
const ArendelistaPage = lazy(() => import("./screens/ArendelistaPage").then(m => ({ default: m.ArendelistaPage })));
const StatistikPage = lazy(() => import("./screens/StatistikPage").then(m => ({ default: m.StatistikPage })));
const AdminPage = lazy(() => import("./screens/AdminPage").then(m => ({ default: m.AdminPage })));
const MinProfilPage = lazy(() => import("./screens/MinProfilPage").then(m => ({ default: m.default })));
const LoginPage = lazy(() => import("./screens/LoginPage").then(m => ({ default: m.LoginPage })));
const InviteAcceptPage = lazy(() => import("./screens/InviteAcceptPage").then(m => ({ default: m.InviteAcceptPage })));
const ResetPasswordPage = lazy(() => import("./screens/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const Forbidden = lazy(() => import("./components/Forbidden").then(m => ({ default: m.Forbidden })));
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { OnboardingTour } from "./components/Onboarding/OnboardingTour";

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="lg" text="Laddar sida..." />
      <p className="mt-4 text-gray-600">Vänligen vänta...</p>
    </div>
  </div>
);

// Validera miljövariabler innan appen startar
try {
  validateEnv();
} catch (error) {
  console.error('Miljövalidering misslyckades:', error);
  // I utvecklingsläge, visa felmeddelande
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto;">
        <h1 style="color: #dc2626;">🚨 Konfigurationsfel</h1>
        <p>Appen kunde inte starta på grund av saknade miljövariabler.</p>
        <pre style="background: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto;">
          ${error instanceof Error ? error.message : 'Okänt fel'}
        </pre>
        <p><strong>Lösning:</strong> Skapa en .env-fil i projektets rot med följande variabler:</p>
        <pre style="background: #f3f4f6; padding: 15px; border-radius: 5px;">
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=Vallentuna Kommun
        </pre>
      </div>
    `;
  }
  // Stoppa appen från att starta
  throw error;
}

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <OnboardingProvider>
            <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="/invite/:token" element={<InviteAcceptPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
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
              <OnboardingTour />
            </Suspense>
          </OnboardingProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
