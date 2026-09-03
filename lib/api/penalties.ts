import { apiClient } from "./client";
import type { CreatePenaltyPayload, Penalty } from "@/types/penalties";

function unwrapList(response: unknown): Penalty[] {
  if (Array.isArray(response)) return response as Penalty[];
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Penalty[];
  }
  return [];
}

function unwrapOne(response: unknown): Penalty {
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object") return obj.data as Penalty;
    return obj as unknown as Penalty;
  }
  return response as Penalty;
}

export const penaltiesApi = {
  async listGroupPenalties(groupId: string): Promise<Penalty[]> {
    const response = await apiClient<unknown>(`/api/v1/groups/${groupId}/penalties/`, { method: "GET" });
    return unwrapList(response);
  },

  async createPenalty(groupId: string, payload: CreatePenaltyPayload): Promise<Penalty> {
    const response = await apiClient<unknown>(`/api/v1/groups/${groupId}/penalties/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapOne(response);
  },

  async resolvePenalty(groupId: string, penaltyId: string): Promise<Penalty> {
    const response = await apiClient<unknown>(`/api/v1/groups/${groupId}/penalties/${penaltyId}/resolve/`, {
      method: "POST",
    });
    return unwrapOne(response);
  },
};
