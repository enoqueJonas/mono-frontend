/**
 * Tipos de dados para autenticação e utilizadores
 */

export interface User {
  id?: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  did?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  phone_number: string;
  password: string;
}

export interface AuthResponseData {
  access: string;
  refresh: string;
  user: User;
}

export interface TokenRefreshPayload {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
  refresh?: string;
  [key: string]: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
