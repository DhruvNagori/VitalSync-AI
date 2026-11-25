import { createContext, useContext, useEffect, useState } from "react";
import { ACCESS_TOKEN_KEY, getAccessToken } from "../services/api";
import {
  getCurrentAccount,
  loginAccount,
  registerAccount
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getAccessToken()) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const user = await getCurrentAccount();
        if (active) setCurrentUser(user);
      } catch {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      } finally {
        if (active) setIsAuthLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  async function register(userData) {
    try {
      const result = await registerAccount(userData);
      sessionStorage.setItem(ACCESS_TOKEN_KEY, result.access_token);
      setCurrentUser(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async function login(email, password, rememberMe) {
    try {
      const result = await loginAccount(email, password, rememberMe);
      const storage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem(ACCESS_TOKEN_KEY);
      storage.setItem(ACCESS_TOKEN_KEY, result.access_token);
      setCurrentUser(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  function logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthLoading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
