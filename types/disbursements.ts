export type DisbursementStatus = "AWAITING_CONSENSUS" | "APPROVED" | "COMPLETED";

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
  payout_required?: boolean;
  payout_status?: "READY" | "INTENT_ANCHORING" | "INTENT_ANCHORED" | "SENDING"
    | "PENDING" | "UNKNOWN" | "PROVIDER_CONFIRMED" | "PROVIDER_FAILED"
    | "SETTLEMENT_ANCHORING" | "SETTLEMENT_ANCHORED" | null;
  payout_reference?: string | null;
  payout_transaction_id?: string | null;
  requested_at: string;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDisbursementPayload {
  cycle_number: number;
}
