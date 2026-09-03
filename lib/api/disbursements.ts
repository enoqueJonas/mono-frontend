import { apiClient } from "./client";
import type { CreateDisbursementPayload, Disbursement } from "@/types/disbursements";

function unwrapList(response: unknown): Disbursement[] {
  if (Array.isArray(response)) return response as Disbursement[];
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Disbursement[];
  }
  return [];
}

function unwrapOne(response: unknown): Disbursement {
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object") return obj.data as Disbursement;
    return obj as unknown as Disbursement;
  }
  return response as Disbursement;
}

export const disbursementsApi = {
  async listGroupDisbursements(groupId: string): Promise<Disbursement[]> {
    const response = await apiClient<unknown>(`/api/v1/groups/${groupId}/disbursements/`, { method: "GET" });
    return unwrapList(response);
  },

  async createDisbursement(groupId: string, payload: CreateDisbursementPayload): Promise<Disbursement> {
    const response = await apiClient<unknown>(`/api/v1/groups/${groupId}/disbursements/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapOne(response);
  },

  async getDisbursement(groupId: string, disbursementId: string): Promise<Disbursement> {
    const response = await apiClient<unknown>(`/api/v1/groups/${groupId}/disbursements/${disbursementId}/`, { method: "GET" });
    return unwrapOne(response);
  },

  async approveDisbursement(groupId: string, disbursementId: string): Promise<Disbursement> {
    const response = await apiClient<unknown>(`/api/v1/groups/${groupId}/disbursements/${disbursementId}/approve/`, { method: "POST" });
    return unwrapOne(response);
  },

  async completeDisbursement(groupId: string, disbursementId: string): Promise<Disbursement> {
    const response = await apiClient<unknown>(`/api/v1/groups/${groupId}/disbursements/${disbursementId}/complete/`, { method: "POST" });
    return unwrapOne(response);
  },
};
