import { ApiError } from "@/types/api";
import { extractFieldErrors } from "./errors";

// Chaves de armazenamento local
const ACCESS_TOKEN_KEY = "mono_access_token";
const REFRESH_TOKEN_KEY = "mono_refresh_token";

export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setAccessToken(token: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // Falha silenciosa em ambientes restritos
    }
  },
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setRefreshToken(token: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // Falha silenciosa
    }
  },
  clearTokens(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Falha silenciosa
    }
  },
};

// Obter Base URL configurada via NEXT_PUBLIC_API_BASE_URL
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && typeof envUrl === "string") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "";
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  isRetry?: boolean;
}

// Fila para evitar múltiplos refreshes simultâneos
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.clearTokens();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mono:auth:logout"));
    }
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/accounts/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        tokenStorage.clearTokens();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mono:auth:logout"));
        }
        return null;
      }

      const json = await response.json();
      const newAccess = json?.data?.access || json?.access;
      const newRefresh = json?.data?.refresh || json?.refresh;

      if (newAccess && typeof newAccess === "string") {
        tokenStorage.setAccessToken(newAccess);
        if (newRefresh && typeof newRefresh === "string") {
          tokenStorage.setRefreshToken(newRefresh);
        }
        return newAccess;
      }

      tokenStorage.clearTokens();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mono:auth:logout"));
      }
      return null;
    } catch {
      tokenStorage.clearTokens();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mono:auth:logout"));
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Cliente HTTP centralizado para comunicação com a API Django REST Framework
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, isRetry = false, headers = {}, ...restOptions } = options;

  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      requestHeaders["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
        signal: restOptions.signal || controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err: unknown) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    const targetUrl = `${baseUrl || "origem local"}${normalizedEndpoint}`;
    throw new ApiError(
      `Falha de ligação ao backend (${targetUrl}): ${errorDetail}. Se o backend estiver a correr localmente (ex: localhost:8000), o browser no ambiente de nuvem da pré-visualização não consegue aceder a localhost sem um túnel ou configuração CORS no Django.`,
      0
    );
  }

  // Tratamento de 401 para Refresh Token automático
  if (response.status === 401 && !skipAuth && !isRetry) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return apiClient<T>(endpoint, {
        ...options,
        isRetry: true,
      });
    }
  }

  let responseData: unknown = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    const status = response.status;
    const errorData = (responseData && typeof responseData === "object" ? responseData : {}) as Record<string, unknown>;

    let message = "Não foi possível concluir a operação. Tente novamente.";
    if (typeof errorData.message === "string" && errorData.message) {
      message = errorData.message;
    } else if (typeof errorData.detail === "string" && errorData.detail) {
      message = errorData.detail;
    } else if (status === 401) {
      message = "Sessão expirada ou credenciais inválidas.";
    } else if (status === 403) {
      message = "Não tem permissão para realizar esta acção.";
    } else if (status === 404) {
      message = "Recurso não encontrado.";
    }

    const fieldErrors = extractFieldErrors(errorData);

    throw new ApiError(message, status, errorData, fieldErrors);
  }

  return responseData as T;
}
