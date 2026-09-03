export type DisbursementStatus = "AWAITING_CONSENSUS" | "APPROVED" | "COMPLETED";

export interface Disbursement {
  id: string;
  group: string;
  group_name: string;
  beneficiary: string;
  beneficiary_name: string;
  rotation_order: string;
  group_settings: string;
  settings_version: number;
  cycle_number: number;
  contribution_period: string;
  amount: string;
  currency: string;
  status: DisbursementStatus;
  requested_at: string;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDisbursementPayload {
  cycle_number: number;
}
