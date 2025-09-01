import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { api } from '@/lib/apiClient';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth måste användas inom en AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);

  // Clean localStorage handling
  useEffect(() => {
    // Silent localStorage handling
  }, []);

  // Session timeout - 30 minuter inaktivitet
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minuter
  const inactivityTimerRef = useRef<NodeJS.Timeout>();

  // Kontrollera om användaren är inloggad vid app-start
  useEffect(() => {
    const checkAuth = async () => {
      if (accessToken) {
        try {
          const response = await api(`/users/me`);

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Access token är ogiltig, försök med refresh token
            if (refreshToken) {
              const refreshed = await refreshAccessToken();
              if (!refreshed) {
                // Båda tokens är ogiltiga, logga ut
                logout();
              }
            } else {
              logout();
            }
          }
        } catch (error) {
          // Försök med refresh token
          if (refreshToken) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
              logout();
            }
          } else {
            logout();
          }
        }
      } else if (refreshToken) {
        // Ingen access token men finns refresh token, försök förnya
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [accessToken, refreshToken]);

  // Event listeners för session timeout
  useEffect(() => {
    if (accessToken) {
      resetInactivityTimer();
      
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, resetInactivityTimer);
        });
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api(`/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Login failed ${response.status}: ${text.slice(0,120)}`);
      }

      const data = await response.json();
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    } catch (error) {
      throw error;
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken) return false;
    
    try {
      const response = await api(`/users/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setUser(data.user);
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      } else {
        // Refresh token är ogiltig
        logout();
        return false;
      }
    } catch (error) {
      logout();
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (accessToken) {
      inactivityTimerRef.current = setTimeout(() => {
        logout();
      }, SESSION_TIMEOUT);
    }
  }, [accessToken]);

  const isAuthenticated = !!user && !!accessToken;

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    login,
    logout,
    refreshAccessToken,
    loading,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
