/**
 * Tipos e enums do domínio MONO (Xitique, Membros, Contribuições, Rotação, etc.)
 * Respeita estritamente o contrato da API existente
 */

export type UserRole = "MANAGER" | "TREASURER" | "MEMBER";

export type MemberStatus = "ACTIVE" | "SUSPENDED" | "LEFT";

export type ContributionOrigin = "MANUAL" | "MOBILE_WALLET";

export type ContributionStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REVERSED";

export type RotationItemStatus = "PENDING" | "CURRENT" | "COMPLETED" | "SKIPPED";

export type DisbursementStatus = "AWAITING_CONSENSUS" | "APPROVED" | "COMPLETED";

export type PenaltyStatus = "ACTIVE" | "RESOLVED";

export type ContributionFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export type RotationStrategy = "FIXED_ORDER" | "RANDOM";

export type CredentialStatus = "VALID" | "REVOKED" | "ACTIVE" | "EXPIRED" | string;

export type AppStatus =
  | MemberStatus
  | ContributionStatus
  | RotationItemStatus
  | DisbursementStatus
  | PenaltyStatus
  | "VALID"
  | "REVOKED";
