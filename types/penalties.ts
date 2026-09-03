export type PenaltyStatus = "ACTIVE" | "RESOLVED";

export interface Penalty {
  id: string;
  member: string;
  member_name: string;
  reason: string;
  status: PenaltyStatus;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePenaltyPayload {
  member_id: string;
  reason: string;
}
