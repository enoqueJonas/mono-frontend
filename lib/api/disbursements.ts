import { apiClient } from "./client";
import type { CreateDisbursementPayload, Disbursement, ExternalPaymentReport, TreasuryMandate, ExternalWalletProvider } from "@/types/disbursements";

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
  async executeSandboxDisbursement(groupId: string, disbursementId: string): Promise<Disbursement> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/disbursements/${disbursementId}/sandbox-execute/`,
      { method: "POST" },
    );
    return unwrapOne(response);
  },
  async getTreasuryMandate(groupId: string): Promise<TreasuryMandate | null> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/treasury-mandate/`, { method: "GET" }
    );
    if (response && typeof response === "object") {
      const data = (response as Record<string, unknown>).data;
      return data && typeof data === "object" ? data as TreasuryMandate : null;
    }
    return null;
  },

  async appointTreasuryMandate(groupId: string, payload: {
    group_member_id: string; provider: ExternalWalletProvider; wallet_alias: string;
  }): Promise<TreasuryMandate> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/treasury-mandate/`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    const obj = response as { data?: TreasuryMandate };
    if (!obj?.data) throw new Error("Resposta de nomeação inválida.");
    return obj.data;
  },

  async openExternalPayment(groupId: string, disbursementId: string): Promise<Disbursement> {
    return unwrapOne(await apiClient<unknown>(
      `/api/v1/groups/${groupId}/disbursements/${disbursementId}/open-external/`,
      { method: "POST" },
    ));
  },

  async reportExternalPayment(groupId: string, disbursementId: string, reference: string): Promise<Disbursement> {
    return unwrapOne(await apiClient<unknown>(
      `/api/v1/groups/${groupId}/disbursements/${disbursementId}/report-external/`,
      { method: "POST", body: JSON.stringify({ transfer_reference: reference }) },
    ));
  },

  async getExternalPaymentReport(groupId: string, disbursementId: string): Promise<ExternalPaymentReport | null> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/disbursements/${disbursementId}/report-external/`,
      { method: "GET" },
    );
    if (response && typeof response === "object") {
      const data = (response as Record<string, unknown>).data;
      return data && typeof data === "object" ? data as ExternalPaymentReport : null;
    }
    return null;
  },

  async acknowledgeExternalPayment(groupId: string, disbursementId: string, received: boolean, dispute_reason = ""): Promise<Disbursement> {
    return unwrapOne(await apiClient<unknown>(
      `/api/v1/groups/${groupId}/disbursements/${disbursementId}/acknowledge-external/`,
      { method: "POST", body: JSON.stringify({ received, dispute_reason }) },
    ));
  },

  async finalizeExternalPayment(groupId: string, disbursementId: string): Promise<Disbursement> {
    return unwrapOne(await apiClient<unknown>(
      `/api/v1/groups/${groupId}/disbursements/${disbursementId}/finalize-external/`,
      { method: "POST" },
    ));
  },
};
