"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  api,
  getAuthToken,
  setAuthToken,
  clearAuthTokens,
  getStoredUser,
  setStoredUser,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    role: string,
    displayName?: string,
    handle?: string
  ) => Promise<void>;
  logout: () => void;
  demoLogin: (role: "CREATOR" | "BRAND" | "ADMIN") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = getAuthToken();
    const savedUser = getStoredUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      setAuthToken(res.accessToken);
      setStoredUser(res.user);
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    role: string,
    displayName?: string,
    handle?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register({ email, password, role, displayName, handle });
      setAuthToken(res.accessToken);
      setStoredUser(res.user);
      setToken(res.accessToken);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthTokens();
    setToken(null);
    setUser(null);
  };

  const demoLogin = async (role: "CREATOR" | "BRAND" | "ADMIN") => {
    let email = "alex@viralwar.com";
    if (role === "BRAND") email = "brand@nike.com";
    if (role === "ADMIN") email = "admin@viralwar.com";
    await login(email, "Password@123");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        demoLogin,
      }}
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
