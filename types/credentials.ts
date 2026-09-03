export type CredentialStatus = "ACTIVE" | "REVOKED" | "EXPIRED" | string;

export interface VerifiableCredential {
  id: string;
  credential_type: string;
  effective_status: CredentialStatus;
  group_id: string;
  group_name: string;
  group_member_id: string;
  holder_user_id: string;
  holder_name: string;
  issuer: string;
  holder: string;
  issued_by_name: string;
  period_start: string;
  period_end: string;
  valid_from: string;
  valid_until: string;
  credential_hash: string;
  credential_document: Record<string, unknown>;
  revoked_at: string | null;
  revocation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueCredentialPayload {
  group_member_id: string;
  period_start: string;
  period_end: string;
}

export interface VerifyCredentialPayload {
  credential: Record<string, unknown>;
}

export interface VerifyCredentialResult {
  valid: boolean;
}

export interface RevokeCredentialPayload {
  reason?: string;
}

export interface RevokeCredentialResult {
  credential_id: string;
  status: CredentialStatus;
  revoked_at: string | null;
}
