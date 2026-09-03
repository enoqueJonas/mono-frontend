import { apiClient } from "./client";
import type {
  RegisterPayload,
  LoginPayload,
  AuthResponseData,
  User,
  TokenRefreshPayload,
  TokenRefreshResponse,
} from "@/types/auth";
import type { ApiResponse } from "@/types/api";

/**
 * Serviço de autenticação conectado aos endpoints reais do DRF
 */
export const authApi = {
  /**
   * POST /api/v1/accounts/register/
   */
  async register(payload: RegisterPayload): Promise<ApiResponse<unknown>> {
    return apiClient<ApiResponse<unknown>>("/api/v1/accounts/register/", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /api/v1/accounts/login/
   * Retorna { data: { access: "...", refresh: "...", user: {} } }
   */
  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> {
    return apiClient<ApiResponse<AuthResponseData>>("/api/v1/accounts/login/", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /api/v1/accounts/token/refresh/
   */
  async refreshToken(payload: TokenRefreshPayload): Promise<TokenRefreshResponse> {
    return apiClient<TokenRefreshResponse>("/api/v1/accounts/token/refresh/", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /api/v1/accounts/me/
   * Retorna os dados do utilizador autenticado
   */
  async getMe(): Promise<ApiResponse<User> | User> {
    return apiClient<ApiResponse<User> | User>("/api/v1/accounts/me/", {
      method: "GET",
    });
  },
};
