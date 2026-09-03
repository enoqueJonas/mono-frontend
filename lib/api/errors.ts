import { ApiError, type DrfFieldErrors } from "@/types/api";

/**
 * Converte qualquer erro (Fetch, DRF, rede) numa mensagem legível e amigável
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message) {
      return error.message;
    }
    if (error.data?.detail) {
      return error.data.detail;
    }
    if (error.data?.message) {
      return error.data.message;
    }
    if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
      const firstKey = Object.keys(error.fieldErrors)[0];
      const val = error.fieldErrors[firstKey];
      if (Array.isArray(val) && val.length > 0) {
        return `${firstKey}: ${val[0]}`;
      }
      if (typeof val === "string") {
        return `${firstKey}: ${val}`;
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

/**
 * Extrai erros específicos por campo retornados pelo Django REST Framework
 */
export function extractFieldErrors(data: unknown): DrfFieldErrors | undefined {
  if (!data || typeof data !== "object") return undefined;

  const result: DrfFieldErrors = {};
  let hasFieldErrors = false;

  for (const [key, value] of Object.entries(data)) {
    if (key === "message" || key === "detail" || key === "code" || key === "status") {
      continue;
    }

    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      result[key] = value;
      hasFieldErrors = true;
    } else if (typeof value === "string") {
      result[key] = [value];
      hasFieldErrors = true;
    }
  }

  return hasFieldErrors ? result : undefined;
}
