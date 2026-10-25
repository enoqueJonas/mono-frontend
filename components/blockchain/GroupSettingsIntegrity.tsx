"use client";

import { blockchainAuditApi } from "@/lib/api/groups";
import { IntegrityStatus } from "./IntegrityStatus";

export function GroupSettingsIntegrity({ groupId, version }: { groupId: string; version: number }) {
  return <IntegrityStatus onVerify={() => blockchainAuditApi.verifyGroupSettings(groupId, version)} />;
}
