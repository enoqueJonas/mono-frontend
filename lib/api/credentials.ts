import { apiClient } from "./client";
import type {
  IssueCredentialPayload,
  RevokeCredentialPayload,
  RevokeCredentialResult,
  VerifiableCredential,
  VerifyCredentialPayload,
  VerifyCredentialResult,
} from "@/types/credentials";

function unwrapData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export const credentialsApi = {
  async listMyCredentials(): Promise<VerifiableCredential[]> {
    const response = await apiClient<unknown>("/api/v1/credentials/", {
      method: "GET",
    });
    const data = unwrapData<VerifiableCredential[] | undefined>(response);
    return Array.isArray(data) ? data : [];
  },

  async getCredential(credentialId: string): Promise<VerifiableCredential> {
    const response = await apiClient<unknown>(
      `/api/v1/credentials/${credentialId}/`,
      { method: "GET" }
    );
    return unwrapData<VerifiableCredential>(response);
  },

  async issueCredential(
    groupId: string,
    payload: IssueCredentialPayload
  ): Promise<VerifiableCredential> {
    const response = await apiClient<unknown>(
      `/api/v1/credentials/${groupId}/credentials/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return unwrapData<VerifiableCredential>(response);
  },

  async verifyCredential(
    payload: VerifyCredentialPayload
  ): Promise<VerifyCredentialResult> {
    const response = await apiClient<unknown>("/api/v1/credentials/verify/", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    return unwrapData<VerifyCredentialResult>(response);
  },

  async revokeCredential(
    credentialId: string,
    payload: RevokeCredentialPayload
  ): Promise<RevokeCredentialResult> {
    const response = await apiClient<unknown>(
      `/api/v1/credentials/${credentialId}/revoke/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return unwrapData<RevokeCredentialResult>(response);
  },
};
