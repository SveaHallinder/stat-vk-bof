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
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  // Session timeout - 30 minuter inaktivitet
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minuter
  const inactivityTimerRef = useRef<NodeJS.Timeout>();

  // Kontrollera om användaren är inloggad vid app-start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api(`/users/me`);

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token är ogiltig, ta bort den
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('authToken');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Event listeners för session timeout
  useEffect(() => {
    if (token) {
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
  }, [token]);

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
        // Hjälper att felsöka om det *inte* är JSON
        const text = await response.text();
        throw new Error(`Login failed ${response.status}: ${text.slice(0,120)}`);
      }

      const data = await response.json();
      
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (token) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log('Session timeout - utloggning på grund av inaktivitet');
        logout();
      }, SESSION_TIMEOUT);
    }
  }, [token]);

  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
