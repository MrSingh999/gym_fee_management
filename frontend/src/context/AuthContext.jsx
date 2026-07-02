import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/features/auth/services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if admin is already logged in (retrieve session cookie)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const data = await authService.checkMe();
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checkingAuth, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
