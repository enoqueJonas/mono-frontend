export type DisbursementStatus = "AWAITING_CONSENSUS" | "APPROVED" | "PROCESSING" | "AWAITING_PAYMENT" | "AWAITING_CONFIRMATION" | "DISPUTED" | "EVIDENCE_PENDING" | "COMPLETED";

export interface Disbursement {
  id: string;
  group: string;
  group_name: string;
  beneficiary: string;
  beneficiary_name: string;
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
  requested_at: string;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDisbursementPayload {
  cycle_number: number;
}

export type ExternalWalletProvider = "MPESA" | "EMOLA" | "OTHER";

export interface TreasuryMandate {
  id: number;
  group: string;
  custodian: string;
  provider: ExternalWalletProvider;
  wallet_alias: string;
  appointed_by: string;
  appointed_at: string;
}

export interface ExternalPaymentReport {
  id: number;
  disbursement: string;
  provider: ExternalWalletProvider;
  wallet_alias: string;
  transfer_reference: string;
  amount: string;
  currency: string;
  reported_by: string;
  beneficiary_user: string;
  reported_at: string;
  status: "REPORTED" | "CONFIRMED" | "DISPUTED";
  confirmed_by: string | null;
  responded_at: string | null;
  dispute_reason: string;
}
