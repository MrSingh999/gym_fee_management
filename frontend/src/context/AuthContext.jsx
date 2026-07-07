import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/services/authService";

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
        console.error("Auth verification error:", err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Listen for transparent session expiry event
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };
    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);

    // Ensure we have the fully populated member/admin doc immediately after login
    // (login response may not include populated plan/fee fields).
    const me = await authService.checkMe();
    if (me?.success) {
      setUser(me.user);
    } else {
      // Fallback to whatever login returned
      setUser(data.user);
    }

    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfilePicture = (profilePictureUrl) => {
    setUser((prev) => (prev ? { ...prev, profilePicture: profilePictureUrl } : null));
  };

  return (
    <AuthContext.Provider
      value={{ user, checkingAuth, login, logout, setUser, updateProfilePicture }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
