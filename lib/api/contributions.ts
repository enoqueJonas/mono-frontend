import { apiClient } from "./client";
import type {
  Contribution,
  CreateContributionPayload,
} from "@/types/contributions";

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

function unwrapObject<T>(response: unknown): T {
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object") return obj.data as T;
    return obj as T;
  }
  throw new Error("Formato de resposta inválido ao processar a contribuição.");
}

export const contributionsApi = {
  async verifyIntegrity(groupId: string, contributionId: string): Promise<import('./groups').BlockchainIntegrityResult> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/contributions/${contributionId}/integrity/`,
      { method: 'GET' }
    );
    return unwrapObject<import('./groups').BlockchainIntegrityResult>(response);
  },
  async listGroupContributions(groupId: string | number): Promise<Contribution[]> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/contributions/`,
      { method: "GET" }
    );
    return unwrapList<Contribution>(response);
  },

  async createManualContribution(
    groupId: string | number,
    payload: CreateContributionPayload
  ): Promise<Contribution> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/contributions/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return unwrapObject<Contribution>(response);
  },
};
