"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@/lib/api/auth";
import { logout as apiLogout } from "@/lib/api/auth";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (token: string, user: User) => void;
  /**
   * Merge fields into the cached user.
   *
   * The user lives in React state AND in localStorage, so a profile change made
   * mid-session (the email Tamara needs, say) has to be written to both or the
   * next mount reads the stale copy back and asks for it again.
   */
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "qafila_token";
const USER_KEY = "qafila_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  // Listen for 401 logout events dispatched by the API client
  useEffect(() => {
    const handleForceLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("qafila:logout", handleForceLogout);
    return () => window.removeEventListener("qafila:logout", handleForceLogout);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const merged = { ...current, ...patch };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore — token may already be invalid
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoggedIn: !!token, login, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
