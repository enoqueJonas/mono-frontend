"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  User,
  AuthTokens,
  AuthContextType,
  LoginPayload,
  RegisterPayload,
  AuthResponseData,
} from "@/types/auth";
import { authApi } from "@/lib/api/auth";
import { tokenStorage } from "@/lib/api/client";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Logout local seguro
  const logout = useCallback(() => {
    tokenStorage.clearTokens();
    setTokens(null);
    setUser(null);
  }, []);

  // Obter dados do utilizador autenticado
  const refreshUser = useCallback(async () => {
    const access = tokenStorage.getAccessToken();
    if (!access) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      const userData = (response as { data?: User }).data || (response as User);
      if (userData && (userData.phone_number || userData.first_name)) {
        setUser(userData);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Inicialização da sessão no cliente
  useEffect(() => {
    const access = tokenStorage.getAccessToken();
    const refresh = tokenStorage.getRefreshToken();
    if (access && refresh) {
      setTokens({ accessToken: access, refreshToken: refresh });
    }

    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener("mono:auth:logout", handleAuthLogout);
    refreshUser();

    return () => {
      window.removeEventListener("mono:auth:logout", handleAuthLogout);
    };
  }, [logout, refreshUser]);

  // Login
  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);

    const resData: AuthResponseData | undefined =
      response?.data || (response as unknown as AuthResponseData);

    if (!resData || !resData.access || !resData.refresh) {
      throw new Error("Resposta de autenticação inválida do servidor.");
    }

    tokenStorage.setAccessToken(resData.access);
    tokenStorage.setRefreshToken(resData.refresh);

    setTokens({
      accessToken: resData.access,
      refreshToken: resData.refresh,
    });

    if (resData.user) {
      setUser(resData.user);
    } else {
      try {
        const me = await authApi.getMe();
        const userData = (me as { data?: User }).data || (me as User);
        setUser(userData);
      } catch {
        // Ignora caso falhe temporariamente
      }
    }
  }, []);

  // Registo
  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload);
    return {
      success: true,
      message: response.message || "Conta registada com sucesso.",
    };
  }, []);

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!tokens && !!tokens.accessToken,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider");
  }
  return context;
}
