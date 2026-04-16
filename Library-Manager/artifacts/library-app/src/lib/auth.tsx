import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("library_token");
    }
    return null;
  });

  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (token) {
      refetch();
    }
  }, [token, refetch]);

  const login = (newToken: string) => {
    localStorage.setItem("library_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("library_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout, token }}>
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
