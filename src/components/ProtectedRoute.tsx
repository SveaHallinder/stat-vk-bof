import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Visa loading tills auth-check är klar
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#17694c]" />
          <p className="text-gray-600">Kontrollerar inloggning...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Omdirigera till login med ursprunglig destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Användaren har inte rätt roll
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Åtkomst nekad</h1>
          <p className="text-gray-600 mb-4">
            Du har inte behörighet att komma åt denna sida.
          </p>
          <p className="text-sm text-gray-500">
            Krävd roll: {requiredRole} | Din roll: {user?.role}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
