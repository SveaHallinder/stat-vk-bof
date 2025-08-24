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

  // Loading state hanteras redan ovan

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
