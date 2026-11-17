import { apiClient } from "./client";
import type { CreateDisbursementPayload, Disbursement, ExternalWalletCustody } from "@/types/disbursements";

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
  async getExternalWalletCustody(groupId: string): Promise<ExternalWalletCustody | null> {
    const response = await apiClient<unknown>("/api/v1/groups/" + groupId + "/external-wallet-custody/", { method: "GET" });
    if (!response || typeof response !== "object") return null;
    const obj = response as Record<string, unknown>;
    if ("data" in obj) return (obj.data ?? null) as ExternalWalletCustody | null;
    return response as ExternalWalletCustody;
  },

  async designateExternalWallet(groupId: string, data: { member_id: string; provider: "M_PESA" | "E_MOLA"; wallet_number: string; }): Promise<ExternalWalletCustody> {
    const response = await apiClient<unknown>("/api/v1/groups/" + groupId + "/external-wallet-custody/", { method: "POST", body: JSON.stringify(data) });
    const obj = response as Record<string, unknown>;
    return (obj.data ?? response) as ExternalWalletCustody;
  },

  async reportExternalPayment(groupId: string, id: string, data: { reference: string; recipient_wallet_number: string; }): Promise<void> {
    await apiClient<unknown>("/api/v1/groups/" + groupId + "/disbursements/" + id + "/report-payment/", { method: "POST", body: JSON.stringify(data) });
  },

  async confirmExternalPayment(groupId: string, id: string): Promise<void> {
    await apiClient<unknown>("/api/v1/groups/" + groupId + "/disbursements/" + id + "/confirm-receipt/", { method: "POST" });
  },

  async disputeExternalPayment(groupId: string, id: string, reason: string): Promise<void> {
    await apiClient<unknown>("/api/v1/groups/" + groupId + "/disbursements/" + id + "/dispute-receipt/", { method: "POST", body: JSON.stringify({ reason }) });
  },
};
