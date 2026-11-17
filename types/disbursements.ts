export type DisbursementStatus = "AWAITING_CONSENSUS" | "APPROVED" | "PAYMENT_REPORTED" | "DISPUTED" | "COMPLETED" | "PROCESSING";

export interface ExternalWalletCustody {
  custodian: string;
  custodian_user_id: string;
  provider: "M_PESA" | "E_MOLA";
  wallet_number: string;
  verification_level: "SELF_DECLARED_NOT_PROVIDER_VERIFIED";
}

export interface ExternalPaymentEvidence {
  provider: string;
  reference: string;
  recipient_wallet_number: string;
  reported_by: string;
  status: "REPORTED" | "CONFIRMED" | "DISPUTED";
  reported_at: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  disputed_at: string | null;
  dispute_reason: string;
  verification_level: "UNVERIFIED_CLAIM" | "BENEFICIARY_ATTESTED";
}

export interface Disbursement {
  id: string;
  group: string;
  group_name: string;
  beneficiary: string;
  beneficiary_name: string;
  beneficiary_user_id?: string;
  rotation_order: string;
  rotation_position: number;
  group_settings: string;
  settings_version: number;
  cycle_number: number;
  contribution_period: string;
  amount: string;
  currency: string;
  status: DisbursementStatus;
  proposed_by?: string | null;
  required_approvals?: number;
  approval_count?: number;
  eligible_approver_ids?: string[];
  approved_by_ids?: string[];
  custodian_at_proposal?: string | null;
  custodian_user_id?: string | null;
  custody_provider_at_proposal?: string;
  custody_wallet_at_proposal?: string;
  external_payment?: ExternalPaymentEvidence | null;
  requested_at: string;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDisbursementPayload {
  cycle_number: number;
}
