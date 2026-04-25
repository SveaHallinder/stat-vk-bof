import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./globals.css";
import { validateEnv } from "./config/env";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./lib/ErrorBoundary";
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
import { ResetPasswordPage } from "./screens/ResetPasswordPage";
import { Forbidden } from "./components/Forbidden";
import { NotFound } from "./components/NotFound";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "./components/ui/loading-spinner";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { RefreshProvider } from "./contexts/RefreshContext";
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

const shouldLazyLoadStatistik = import.meta.env.VITE_ENABLE_LAZY === "1";
const StatistikPageLazy = lazy(async () => ({
  default: (await import("./screens/StatistikPage")).StatistikPage,
}));

const statistikRouteElement = (
  <ProtectedRoute>
    {shouldLazyLoadStatistik ? <StatistikPageLazy /> : <StatistikPage />}
  </ProtectedRoute>
);

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <RefreshProvider>
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
                  <Route path="/statistik" element={statistikRouteElement} />
                  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>} />
                  <Route path="/min-profil" element={<ProtectedRoute><MinProfilPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <OnboardingTour />
              </Suspense>
            </OnboardingProvider>
          </RefreshProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
