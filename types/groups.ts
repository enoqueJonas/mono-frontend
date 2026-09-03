import type { UserRole } from "./domain";

export type ContributionFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export type RotationStrategy = "FIXED_ORDER" | "RANDOM";

export type GroupStatus =
  | "ACTIVE"
  | "PENDING"
  | "SUSPENDED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export interface GroupSettings {
  contribution_amount: string;
  contribution_frequency: ContributionFrequency;
  maximum_members: number;
  rotation_strategy: RotationStrategy;
  requires_consensus: boolean;
  allow_manual_contributions: boolean;
  currency: string;
  version?: number | string;
}

export type GroupMemberRole = "MANAGER" | "TREASURER" | "MEMBER" | string;

export type GroupMemberStatus = "ACTIVE" | "SUSPENDED" | "LEFT" | string;

export interface GroupMember {
  id: string | number;
  user?:
    | string
    | number
    | {
        id?: string | number;
        first_name?: string;
        last_name?: string;
        phone_number?: string;
        email?: string;
        [key: string]: unknown;
      };
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joined_at?: string;
  created_at?: string;
}

export interface AddGroupMemberPayload {
  phone_number: string;
}

export interface UpdateGroupSettingsPayload {
  contribution_amount?: string;
  currency?: string;
  contribution_frequency?: ContributionFrequency;
  maximum_members?: number;
  rotation_strategy?: RotationStrategy;
  requires_consensus?: boolean;
  allow_manual_contributions?: boolean;
}

export interface Group {
  id: string | number;
  name: string;
  description?: string | null;
  status?: GroupStatus;
  settings?: Partial<GroupSettings>;
  user_role?: UserRole | string;
  role?: UserRole | string;
  my_role?: UserRole | string;
  members_count?: number;
  total_members?: number;
  current_cycle?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GroupDetail extends Group {
  settings: GroupSettings;
  created_by?:
    | string
    | number
    | {
        id: string | number;
        first_name?: string;
        last_name?: string;
        phone_number?: string;
      };
}

export interface CreateGroupPayload {
  name: string;
  description: string;
  settings: {
    contribution_amount: string;
    contribution_frequency: ContributionFrequency;
    maximum_members: number;
    rotation_strategy: RotationStrategy;
    requires_consensus: boolean;
    allow_manual_contributions: boolean;
    currency: string;
  };
}

export const FREQUENCY_LABELS: Record<ContributionFrequency, string> = {
  DAILY: "Diária",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
};

export const ROTATION_LABELS: Record<RotationStrategy, string> = {
  FIXED_ORDER: "Ordem fixa",
  RANDOM: "Aleatória",
};

export const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Gestor",
  TREASURER: "Tesoureiro",
  MEMBER: "Membro",
};

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspenso",
  LEFT: "Saiu",
};
