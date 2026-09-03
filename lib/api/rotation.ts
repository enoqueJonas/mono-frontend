import { apiClient } from "./client";
import type { GenerateRotationPayload, RotationOrder } from "@/types/rotation";

function unwrapList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (obj.data && typeof obj.data === "object") {
      const data = obj.data as Record<string, unknown>;
      if (Array.isArray(data.results)) return data.results as T[];
    }
  }
  return [];
}

export const rotationApi = {
  async listGroupRotation(
    groupId: string | number,
    cycleNumber?: number
  ): Promise<RotationOrder[]> {
    const query = cycleNumber ? `?cycle_number=${cycleNumber}` : "";
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/rotation/${query}`,
      { method: "GET" }
    );
    return unwrapList<RotationOrder>(response);
  },

  async generateRotation(
    groupId: string | number,
    payload: GenerateRotationPayload
  ): Promise<RotationOrder[]> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/rotation/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return unwrapList<RotationOrder>(response);
  },
};
