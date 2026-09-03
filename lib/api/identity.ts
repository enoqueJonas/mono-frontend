import { apiClient } from "./client";
import type { DIDDocument, DIDIdentity } from "@/types/identity";

function unwrapData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export const identityApi = {
  async getMyDID(): Promise<DIDIdentity> {
    const response = await apiClient<unknown>("/api/v1/identity/me/", {
      method: "GET",
    });
    return unwrapData<DIDIdentity>(response);
  },

  async getMyDIDDocument(): Promise<DIDDocument> {
    const response = await apiClient<unknown>("/api/v1/identity/me/document/", {
      method: "GET",
    });
    return unwrapData<DIDDocument>(response);
  },

  async getGroupDID(groupId: string): Promise<DIDIdentity> {
    const response = await apiClient<unknown>(`/api/v1/identity/groups/${groupId}/`, {
      method: "GET",
    });
    return unwrapData<DIDIdentity>(response);
  },

  async getGroupDIDDocument(groupId: string): Promise<DIDDocument> {
    const response = await apiClient<unknown>(
      `/api/v1/identity/groups/${groupId}/document/`,
      { method: "GET" }
    );
    return unwrapData<DIDDocument>(response);
  },
};
