/**
 * Estruturas padrão de resposta e erro do backend Django REST Framework
 */

export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export type DrfFieldErrors = Record<string, string[] | string>;

export interface ApiErrorResponse {
  message?: string;
  detail?: string;
  errors?: DrfFieldErrors;
  [key: string]: unknown;
}

export class ApiError extends Error {
  public status: number;
  public data?: ApiErrorResponse;
  public fieldErrors?: DrfFieldErrors;

  constructor(message: string, status: number, data?: ApiErrorResponse, fieldErrors?: DrfFieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.fieldErrors = fieldErrors;
  }
}
