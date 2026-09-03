export type RotationStatus =
  | "PENDING"
  | "CURRENT"
  | "COMPLETED"
  | "SKIPPED";

export interface RotationOrder {
  id: string;
  member: string;
  member_name: string;
  member_phone_number: string;
  cycle_number: number;
  position: number;
  status: RotationStatus;
  contribution_period: string;
  group_settings: string;
  settings_version: number;
}

export interface GenerateRotationPayload {
  cycle_number: number;
  contribution_period: string;
}
