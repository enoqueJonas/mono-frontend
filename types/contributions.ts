export type ContributionSource = "MANUAL" | "MOBILE_WALLET";

export type ContributionStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "REVERSED";

export interface Contribution {
  id: string;
  member: string;
  member_name: string;
  group_name: string;
  amount: string;
  contribution_period: string;
  reference: string | null;
  source: ContributionSource;
  status: ContributionStatus;
  created_at: string;
}

export interface CreateContributionPayload {
  group_member_id: string;
  amount: string;
  contribution_period: string;
}

export const CONTRIBUTION_SOURCE_LABELS: Record<ContributionSource, string> = {
  MANUAL: "Manual",
  MOBILE_WALLET: "Carteira móvel",
};
